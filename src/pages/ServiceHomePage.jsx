import { useEffect, useState } from 'react'
import { appConfig, isFirebaseConfigReady } from '../config/appConfig'
import { useAuth } from '../hooks/useAuth'
import { listAppliedSchedulesByTeacher } from '../services/applicationService'
import { listSchedules } from '../services/scheduleService'

const roleLabel = (role) => (role === 'admin' ? '관리자' : '상담교사')

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f7f5f2',
  padding: '24px',
}

const cardStyle = {
  width: '100%',
  maxWidth: '720px',
  background: '#ffffff',
  border: '1px solid #e7e2db',
  borderRadius: '16px',
  padding: '28px',
  boxShadow: '0 6px 22px rgba(0, 0, 0, 0.05)',
  fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
}

const titleStyle = {
  margin: 0,
  fontSize: '24px',
  color: '#1f1f1f',
}

const textStyle = {
  marginTop: '10px',
  color: '#5f5a53',
  lineHeight: 1.5,
}

const rowStyle = {
  marginTop: '22px',
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: '10px',
  background: '#be6f4c',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
}

const subtleButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: '10px',
  border: '1px solid #e0d8cd',
  background: '#fff',
  color: '#433f39',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
}

export function ServiceHomePage() {
  const { user, isAuthenticated, isLoading, authMode, lastSyncError, signInDemo, signInWithGoogle, signOut } = useAuth()
  const [scheduleCount, setScheduleCount] = useState(0)
  const [myApplicationCount, setMyApplicationCount] = useState(0)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSchedules() {
      const schedules = await listSchedules()
      if (mounted) {
        setScheduleCount(schedules.length)
      }
    }

    loadSchedules()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadMyApplications() {
      if (!isAuthenticated || !user?.uid) {
        if (mounted) setMyApplicationCount(0)
        return
      }

      const myApplied = await listAppliedSchedulesByTeacher(user.uid)
      if (mounted) {
        setMyApplicationCount(myApplied.length)
      }
    }

    loadMyApplications()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, user?.uid])

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>상담교사 배정 시스템</h1>
        <p style={textStyle}>
          현재는 프로토타입에서 서비스 구조로 전환 중입니다. 다음 단계에서 Firebase 인증/DB를
          연결해 실제 운영 흐름으로 전환합니다.
        </p>
        <p style={{ ...textStyle, marginTop: '8px', fontSize: '14px' }}>
          Auth 상태: {isLoading ? '확인 중...' : isAuthenticated ? `${roleLabel(user.role)} (${user.email})` : '로그인 안됨'}
        </p>
        <p style={{ ...textStyle, marginTop: '4px', fontSize: '13px' }}>
          Auth 모드: {authMode}
        </p>
        <p style={{ ...textStyle, marginTop: '4px', fontSize: '13px' }}>
          Firebase 준비: {appConfig.useFirebase ? (isFirebaseConfigReady() ? '설정 완료' : 'env 미완료') : '비활성화'}
        </p>
        <p style={{ ...textStyle, marginTop: '4px', fontSize: '13px' }}>
          서비스 레이어 조회: 일정 {scheduleCount}건
        </p>
        <p style={{ ...textStyle, marginTop: '4px', fontSize: '13px' }}>
          서비스 레이어 조회: 내 지원 {myApplicationCount}건
        </p>
        {!!lastSyncError && (
          <p style={{ ...textStyle, marginTop: '8px', color: '#b23a2b', fontSize: '13px' }}>
            Firestore 동기화 오류: {lastSyncError}
          </p>
        )}
        {!!authError && (
          <p style={{ ...textStyle, marginTop: '8px', color: '#b23a2b', fontSize: '13px' }}>
            로그인 오류: {authError}
          </p>
        )}
        <div style={rowStyle}>
          <a href="/prototype" style={primaryButton}>
            기존 프로토타입 열기
          </a>
          <a href="/" style={subtleButton}>
            서비스 홈
          </a>
          <button
            type="button"
            style={subtleButton}
            onClick={async () => {
              try {
                setAuthError('')
                await signInWithGoogle()
              } catch (error) {
                setAuthError(error instanceof Error ? error.message : 'Google 로그인 실패')
              }
            }}
          >
            Google 로그인
          </button>
          <button type="button" style={subtleButton} onClick={() => signInDemo('admin')}>
            관리자 데모 로그인
          </button>
          <button type="button" style={subtleButton} onClick={() => signInDemo('teacher')}>
            교사 데모 로그인
          </button>
          <button type="button" style={subtleButton} onClick={signOut}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
