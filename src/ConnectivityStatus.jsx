import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="connectivity-status" role="status">
      <CloudOff aria-hidden="true" size={16} />
      Offline · dina ändringar sparas på enheten
    </div>
  )
}
