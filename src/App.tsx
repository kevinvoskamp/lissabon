import { useState } from 'react'
import Login, { loadAuth, clearAuth, type Auth } from './Login'
import Planner from './Planner'

export default function App() {
  const [auth, setAuth] = useState<Auth | null>(loadAuth)

  if (!auth) {
    return <Login onLogin={setAuth} />
  }
  return (
    <Planner
      auth={auth}
      onLogout={() => {
        clearAuth()
        setAuth(null)
      }}
    />
  )
}
