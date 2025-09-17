type NavigationResult = {
  redirect?: string
}

type MiddlewareFunction = () => NavigationResult | Promise<NavigationResult> | undefined

declare global {
  function defineNuxtRouteMiddleware(middleware: MiddlewareFunction): MiddlewareFunction
  function navigateTo(path: string): NavigationResult
}

export {}
