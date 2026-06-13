import { useState, useEffect, useCallback } from 'react'
import { listCustomers, type CustomerWithStats } from '../db/customers'

export function useCustomers(search = '') {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCustomers(search)
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  return { customers, loading, refresh: load }
}
