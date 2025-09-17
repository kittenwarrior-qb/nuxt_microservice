/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  updateProfile,
  getAuth,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'

interface AuthUser {
  id?: number
  email: string
  firstName?: string
  lastName?: string
  role?: string
  firebaseUid: string
  avatarUrl?: string
  emailVerified: boolean
  authProvider?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.user,
    userDisplayName: (state) => {
      if (!state.user) return ''
      return `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() || state.user.email
    },
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    // Save user and token to localStorage
    saveUserToStorage(user: AuthUser | null, token: string | null = null) {
      if (import.meta.client) {
        if (user) {
          localStorage.setItem('tgdd_user', JSON.stringify(user))
          localStorage.setItem('tgdd_auth_status', 'true')
          if (token) {
            localStorage.setItem('tgdd_token', token)
          }
        } else {
          localStorage.removeItem('tgdd_user')
          localStorage.removeItem('tgdd_auth_status')
          localStorage.removeItem('tgdd_token')
        }
      }
    },

    // Load user and token from localStorage
    loadUserFromStorage(): { user: AuthUser | null; token: string | null } {
      if (import.meta.client) {
        const userData = localStorage.getItem('tgdd_user')
        const authStatus = localStorage.getItem('tgdd_auth_status')
        const token = localStorage.getItem('tgdd_token')
        
        if (userData && authStatus === 'true') {
          try {
            return {
              user: JSON.parse(userData),
              token: token
            }
          } catch {
            // Clear corrupted data
            this.clearStorage()
          }
        }
      }
      return { user: null, token: null }
    },

    // Clear localStorage
    clearStorage() {
      if (import.meta.client) {
        localStorage.removeItem('tgdd_user')
        localStorage.removeItem('tgdd_auth_status')
        localStorage.removeItem('tgdd_token')
      }
    },

    getAuthInstance() {
      const nuxtApp = useNuxtApp()
      // Prefer injected instance from plugin, but safely fallback
      const injected = (nuxtApp.$auth as any)
      if (injected) return injected

      // Fallback: ensure a default app exists on client, then return getAuth()
      if (typeof window !== 'undefined') {
        if (getApps().length === 0) {
          const config = useRuntimeConfig()
          const firebaseConfig = {
            apiKey: config.public.firebaseApiKey,
            authDomain: config.public.firebaseAuthDomain,
            projectId: config.public.firebaseProjectId,
            storageBucket: config.public.firebaseStorageBucket,
            messagingSenderId: config.public.firebaseMessagingSenderId,
            appId: config.public.firebaseAppId
          }
          initializeApp(firebaseConfig)
        }
        return getAuth()
      }
      // On server side, return getAuth() which will throw if used; consumers should be client-only
      return getAuth()
    },
    async initAuth() {
      // Try to load from localStorage first
      const savedData = this.loadUserFromStorage()
      if (savedData.user) {
        this.user = savedData.user
        this.token = savedData.token
        this.isAuthenticated = true
      }

      const $auth = this.getAuthInstance()
      
      return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onAuthStateChanged($auth as any, async (firebaseUser: User | null) => {
          if (firebaseUser) {
            try {
              await this.syncWithBackend(firebaseUser)
            } catch (error) {
              console.error('Error syncing with backend:', error)
              this.error = 'Failed to sync user data'
            }
          } else {
            this.user = null
            this.token = null
            this.isAuthenticated = false
            this.clearStorage()
          }
          resolve(firebaseUser)
        })
      })
    },

    async syncWithBackend(firebaseUser: User) {
      try {
        const token = await firebaseUser.getIdToken()
        this.token = token // Store token in state
        const config = useRuntimeConfig()

        // Retry transient errors (5xx/network) a few times during initial app load
        const maxAttempts = 5
        let attempt = 0
        let lastError: any = null

        while (attempt < maxAttempts) {
          try {
            const response = await fetch(`${config.public.apiBaseUrl}/auth/firebase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            })

            if (response.ok) {
              const data = await response.json()
              this.user = data.user || data
              this.isAuthenticated = true
              this.error = null
              
              // Save to localStorage with token
              this.saveUserToStorage(this.user, this.token)
              return
            }

            // Stop retrying for client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              const text = await response.text().catch(() => '')
              throw new Error(`HTTP error! status: ${response.status}${text ? ` - ${text}` : ''}`)
            }

            // For 5xx, throw to trigger retry
            throw new Error(`HTTP error! status: ${response.status}`)
          } catch (err: any) {
            lastError = err
            attempt++
            // Backoff before next retry (300ms, 600ms, 1200ms, ...)
            const delay = 300 * Math.pow(2, attempt - 1)
            await new Promise((res) => setTimeout(res, delay))
          }
        }

        // If we’re here, all retries failed
        throw lastError || new Error('Failed to sync with backend')
      } catch (error: any) {
        console.error('Backend sync error:', error)
        this.error = error.message || 'Failed to sync with backend'
        throw error
      }
    },

    async signInWithEmail(email: string, password: string) {
      this.loading = true
      this.error = null

      try {
   
        const $auth = this.getAuthInstance()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userCredential = await signInWithEmailAndPassword($auth as any, email, password)
        await this.syncWithBackend(userCredential.user)
        
        return userCredential.user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // If email already exists in Firebase, try to sign in with provided credentials
        if (error?.code === 'auth/email-already-in-use') {
          try {
            const $auth = this.getAuthInstance()
            const userCredential = await signInWithEmailAndPassword($auth as any, email, password)
            await this.syncWithBackend(userCredential.user)
            return userCredential.user
          } catch (signinErr: any) {
            this.error = this.getErrorMessage(signinErr)
            throw signinErr
          }
        }

        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async signUpWithEmail(email: string, password: string, firstName: string, lastName: string) {
      this.loading = true
      this.error = null

      try {
   
        const $auth = this.getAuthInstance()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userCredential = await createUserWithEmailAndPassword($auth as any, email, password)
        
        // Update the user profile with name
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`
        })

        await this.syncWithBackend(userCredential.user)
        
        return userCredential.user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async signInWithGoogle() {
      this.loading = true
      this.error = null

      try {
        const $auth = this.getAuthInstance()
        const provider = new GoogleAuthProvider()
        provider.addScope('email')
        provider.addScope('profile')
        
        const userCredential = await signInWithPopup($auth as any, provider)
        await this.syncWithBackend(userCredential.user)
        
        return userCredential.user
      } catch (error: any) {
        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async signInWithFacebook() {
      this.loading = true
      this.error = null

      try {
   
        const $auth = this.getAuthInstance()
        const provider = new FacebookAuthProvider()
        provider.addScope('email')
        
        const userCredential = await signInWithPopup($auth as any, provider)
        await this.syncWithBackend(userCredential.user)
        
        return userCredential.user
      } catch (error: any) {
        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async signInWithGithub() {
      this.loading = true
      this.error = null

      try {
        const $auth = this.getAuthInstance()
        const provider = new GithubAuthProvider()
        provider.addScope('user:email')
        
        const userCredential = await signInWithPopup($auth as any, provider)
        await this.syncWithBackend(userCredential.user)
        
        return userCredential.user
      } catch (error: any) {
        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      
      try {
   
        const $auth = this.getAuthInstance()
        await signOut($auth as any)
        
        this.user = null
        this.isAuthenticated = false
        this.error = null
        
        // Note: Navigation should be handled by the component calling this method
        // await navigateTo('/auth/login')
      } catch (error: any) {
        this.error = this.getErrorMessage(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async getCurrentUser() {
      const $auth = this.getAuthInstance()
      return ($auth as any).currentUser
    },

    clearError() {
      this.error = null
    },

    getErrorMessage(error: unknown): string {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.'
      }

      const err = error as any
      return errorMessages[err.code] || err.message || 'An unexpected error occurred.'
    }
  }
})
