import crypto from 'crypto'
import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'

interface ZaloPayItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface CreateBody {
  amount: number
  description?: string
  items?: ZaloPayItem[]
  appUser?: string
}

interface ZaloPayCreatePayload {
  app_id: number
  app_user: string
  app_trans_id: string
  app_time: number
  amount: number
  description: string
  callback_url?: string
  item: string
  embed_data: string
  mac: string
  bank_code: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<CreateBody>(event)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - useRuntimeConfig is injected by Nitro at runtime
    const config = useRuntimeConfig()
    const APP_ID = Number(config.zalopayAppId || process.env.ZALOPAY_APP_ID)
    const KEY1 = String(config.zalopayKey1 || process.env.ZALOPAY_KEY1 || '')
    const CALLBACK_URL = String(config.zalopayCallbackUrl || process.env.ZALOPAY_CALLBACK_URL || '')

    if (!APP_ID || !KEY1) {
      throw createError({ statusCode: 500, statusMessage: 'Missing ZaloPay sandbox credentials (APP_ID/KEY1)' })
    }

    const now = Date.now()
    // app_trans_id must start with yymmdd
    const dateVN = new Date(now)
    const yy = String(dateVN.getFullYear()).slice(-2)
    const mm = String(dateVN.getMonth() + 1).padStart(2, '0')
    const dd = String(dateVN.getDate()).padStart(2, '0')
    const prefix = `${yy}${mm}${dd}`

    const app_trans_id = `${prefix}_${Math.random().toString(36).slice(2, 10)}`
    const app_user = body.appUser || 'tgdd_web'
    const amount = Math.max(0, Math.floor(body.amount || 0))
    const description = body.description || `Thanh toan don hang ${app_trans_id}`

    type PublicCfg = { public?: { baseUrl?: string } }
    const publicCfg = (config as unknown as PublicCfg).public
    const redirectUrl = publicCfg?.baseUrl ? `${publicCfg.baseUrl}/checkout` : ''
    const embedObj: Record<string, unknown> = {
      redirecturl: redirectUrl,
      // Force VietQR to maximize chance of getting QR on response
      preferred_payment_method: ['vietqr']
    }
    const embed_data = JSON.stringify(embedObj)
    const items = JSON.stringify(body.items || [])

    // mac = HMACSHA256(key1, app_id|app_trans_id|app_user|amount|app_time|embed_data|item)
    const macInput = `${APP_ID}|${app_trans_id}|${app_user}|${amount}|${now}|${embed_data}|${items}`
    const mac = crypto.createHmac('sha256', KEY1).update(macInput).digest('hex')

    const payload: ZaloPayCreatePayload = {
      app_id: APP_ID,
      app_user,
      app_trans_id,
      app_time: now,
      amount,
      description,
      callback_url: CALLBACK_URL || undefined,
      item: items,
      embed_data,
      mac,
      // request QR (VietQR) as preferred method to encourage QR rendering
      bank_code: '',
    }

    console.log('ZaloPay create request payload:', JSON.stringify(payload, null, 2))
    
    const res = await $fetch<{ return_code: number; return_message: string; order_url?: string; qr_code?: string; zp_trans_token?: string }>('https://sb-openapi.zalopay.vn/v2/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: payload,
    })

    console.log('ZaloPay create response:', JSON.stringify(res, null, 2))

    // Pass-through response to client
    return {
      success: res?.return_code === 1,
      data: res,
      app_trans_id,
    }
  } catch (err: unknown) {
    const e = err as { statusMessage?: string; message?: string }
    console.error('ZaloPay create error:', e)
    throw createError({ statusCode: 500, statusMessage: e?.statusMessage || e?.message || 'ZaloPay create failed' })
  }
})
