import { useEffect, useState } from 'react'
import PrototypeApp from '../features/prototype/PrototypeApp'

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (path === '/prototype') {
      window.history.replaceState({}, '', '/')
      setPath('/')
    }
  }, [path])

  return <PrototypeApp />
}
