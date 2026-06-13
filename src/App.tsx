import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DBContext } from './hooks/useDB'
import { initDB } from './db/client'
import type { DbAdapter } from './db/adapter'
import { Calculator } from './screens/Calculator'
import { Confirm } from './screens/Confirm'
import { History } from './screens/History'
import { Customers } from './screens/Customers'
import { CustomerDetail } from './screens/CustomerDetail'

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
        <div className="flex flex-col h-screen max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/confirm" element={<Confirm />} />
            <Route path="/history" element={<History />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DBContext.Provider>
  )
}
