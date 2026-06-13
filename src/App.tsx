import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { DBContext } from './hooks/useDB'
import { initDB } from './db/client'
import type { DbAdapter } from './db/adapter'
import { Calculator } from './screens/Calculator'
import { Confirm } from './screens/Confirm'
import { History } from './screens/History'
import { Customers } from './screens/Customers'
import { CustomerDetail } from './screens/CustomerDetail'

// Must be inside BrowserRouter to access useNavigate
function AppShell() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listenerPromise = CapApp.addListener('backButton', () => {
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        CapApp.exitApp()
      }
    })

    return () => { listenerPromise.then(h => h.remove()) }
  }, [navigate])

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="/history" element={<History />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [db, setDb] = useState<DbAdapter | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    initDB()
      .then(setDb)
      .catch(e => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400 px-6 text-center">
        Failed to initialize database: {error}
      </div>
    )
  }

  if (!db) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading…
      </div>
    )
  }

  return (
    <DBContext.Provider value={db}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DBContext.Provider>
  )
}
