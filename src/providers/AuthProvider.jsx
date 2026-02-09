import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
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
        await signInWithPopup(auth, googleProvider)
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
