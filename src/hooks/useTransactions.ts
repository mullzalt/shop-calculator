import { useState, useEffect, useCallback } from 'react'
import { listTransactions, countTransactions, sumTransactions, type Transaction, type TransactionFilter } from '../db/transactions'

const PAGE_SIZE = 50

export function useTransactions(filter: TransactionFilter = {}, page = 0) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, count, sum] = await Promise.all([
        listTransactions(filter, PAGE_SIZE, page * PAGE_SIZE),
        countTransactions(filter),
        sumTransactions(filter),
      ])
      setTransactions(data)
      setTotal(count)
      setTotalAmount(sum)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filter), page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  return { transactions, total, totalAmount, loading, refresh: load, pageSize: PAGE_SIZE }
}
