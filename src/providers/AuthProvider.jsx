import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { appConfig } from '../config/appConfig'
import { auth, googleProvider, isFirebaseEnabled } from '../lib/firebase'
import { getUserProfile, upsertUserProfile } from '../services/userService'

const AuthContext = createContext(null)
const SESSION_KEY = 'app.session.v1'

function readInitialSession() {
  // In Firebase mode, rely on onAuthStateChanged as the single source of truth
  // to avoid stale role/session restoration across account switches.
  if (isFirebaseEnabled()) {
    return null
  }

  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readInitialSession)
  const [loading, setLoading] = useState(isFirebaseEnabled())
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null)
        localStorage.removeItem(SESSION_KEY)
        setSyncError('')
        setLoading(false)
        return
      }

      try {
        const normalizedEmail = (firebaseUser.email || '').toLowerCase()
        const inferredRole = appConfig.adminEmails.includes(normalizedEmail) ? 'admin' : 'teacher'

        const baseSession = {
          uid: firebaseUser.uid,
          role: inferredRole,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || '사용자',
        }

        // Write-first to guarantee initial user document creation.
        await upsertUserProfile(baseSession)
        const existingProfile = await getUserProfile(firebaseUser.uid)
        const nextSession = {
          ...baseSession,
          role: existingProfile?.role || baseSession.role,
        }

        setSession(nextSession)
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
        setSyncError('')
      } catch (error) {
        const message = error instanceof Error ? error.message : '프로필 동기화 실패'
        setSyncError(message)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isFirebaseEnabled()) return

    getRedirectResult(auth).catch((error) => {
      const message = error instanceof Error ? error.message : 'Google 로그인 처리에 실패했습니다.'
      setSyncError(message)
    })
  }, [])

  const isMobileBrowser = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    return /iPhone|iPad|iPod|Android/i.test(ua)
  }

  const isIOSBrowser = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    return /iPhone|iPad|iPod/i.test(ua)
  }

  const value = useMemo(
    () => ({
      user: session,
      isAuthenticated: !!session,
      isLoading: loading,
      lastSyncError: syncError,
      authMode: isFirebaseEnabled() ? 'firebase' : 'demo',
      signInDemo(role = 'teacher') {
        const nextSession = {
          uid: role === 'admin' ? 'demo-admin' : 'demo-teacher',
          role,
          email: role === 'admin' ? 'admin@example.com' : 'teacher@example.com',
          name: role === 'admin' ? '관리자 데모' : '교사 데모',
        }
        setSession(nextSession)
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      },
      async signInWithGoogle() {
        if (!isFirebaseEnabled() || !googleProvider) {
          throw new Error('Firebase auth is not enabled')
        }

        try {
          await signInWithPopup(auth, googleProvider)
        } catch (error) {
          const code = error?.code || ''
          const isPopupIssue =
            code === 'auth/popup-blocked' ||
            code === 'auth/popup-closed-by-user' ||
            code === 'auth/cancelled-popup-request'

          // iOS Chrome/Safari often fails redirect due storage partition/session issues.
          // Prefer explicit guidance instead of forcing a redirect loop.
          if (isIOSBrowser() && isPopupIssue) {
            throw new Error('모바일 브라우저 팝업이 차단되었습니다. 주소창 메뉴에서 팝업 차단 해제 후 다시 시도해주세요.')
          }

          if (isMobileBrowser() && isPopupIssue) {
            await signInWithRedirect(auth, googleProvider)
            return
          }

          throw error
        }
      },
      async signOut() {
        // Clear local session immediately to prevent stale-role flashes.
        setSession(null)
        localStorage.removeItem(SESSION_KEY)
        setSyncError('')

        if (isFirebaseEnabled()) {
          await firebaseSignOut(auth)
          return
        }
      },
    }),
    [loading, session, syncError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }
  return value
}
