import { useState, useEffect, useRef } from 'react'
import { CapacitorThermalPrinter } from 'capacitor-thermal-printer'
import type { BluetoothDevice } from 'capacitor-thermal-printer'
import type { PluginListenerHandle } from '@capacitor/core'
import type { Translations } from '../lib/i18n'

interface Props {
  t: Translations
  onSelect: (device: BluetoothDevice) => void
  onClose: () => void
}

export function BluetoothScanModal({ t, onSelect, onClose }: Props) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([])
  const [scanning, setScanning] = useState(true)
  const discoverRef = useRef<PluginListenerHandle | null>(null)
  const finishRef = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      discoverRef.current = await CapacitorThermalPrinter.addListener(
        'discoverDevices',
        ({ devices: found }) => {
          if (cancelled) return
          setDevices(prev => {
            const existing = new Set(prev.map(d => d.address))
            return [...prev, ...found.filter(d => !existing.has(d.address))]
          })
        },
      )
      finishRef.current = await CapacitorThermalPrinter.addListener(
        'discoveryFinish',
        () => { if (!cancelled) setScanning(false) },
      )
      await CapacitorThermalPrinter.startScan()
    }

    start()

    return () => {
      cancelled = true
      discoverRef.current?.remove()
      finishRef.current?.remove()
      CapacitorThermalPrinter.stopScan().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] flex items-end">
      <div className="w-full bg-[var(--bg-card)] rounded-t-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[var(--text-1)] font-semibold">{t.scanPrinter}</h2>
          <button onClick={onClose} className="text-[var(--text-3)] text-xl">✕</button>
        </div>
        {scanning && (
          <div className="px-5 py-2 text-[var(--text-3)] text-sm">{t.scanning}</div>
        )}
        <div className="flex-1 overflow-y-auto">
          {devices.map(d => (
            <button
              key={d.address}
              onClick={() => onSelect(d)}
              className="w-full text-left px-5 py-3 border-b border-[var(--border)]"
            >
              <div className="text-[var(--text-1)] font-medium">{d.name || d.address}</div>
              <div className="text-[var(--text-4)] text-xs">{d.address}</div>
            </button>
          ))}
          {!scanning && devices.length === 0 && (
            <div className="text-center py-10 text-[var(--text-4)]">{t.noDevicesFound}</div>
          )}
        </div>
      </div>
    </div>
  )
}
