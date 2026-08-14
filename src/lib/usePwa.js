import { useCallback, useEffect, useState } from 'react'

function getStandaloneState() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function usePwa() {
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)
  const [isInstalled, setIsInstalled] = useState(getStandaloneState)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [updateRegistration, setUpdateRegistration] = useState(null)
  const [registrationReady, setRegistrationReady] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleInstallPrompt = event => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    let controllerChanged = false
    const handleControllerChange = () => {
      if (controllerChanged) return
      controllerChanged = true
      window.location.reload()
    }

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      navigator.serviceWorker.register('/sw.js').then(registration => {
        setRegistrationReady(true)
        if (registration.waiting) setUpdateRegistration(registration)
        registration.update().catch(() => {})
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateRegistration(registration)
            }
          })
        })
      }).catch(() => setRegistrationReady(false))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    return choice.outcome === 'accepted'
  }, [installPrompt])

  const applyUpdate = useCallback(() => {
    updateRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }, [updateRegistration])

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  return {
    isOnline,
    isInstalled,
    canInstall: Boolean(installPrompt) && import.meta.env.PROD,
    install,
    updateReady: Boolean(updateRegistration),
    applyUpdate,
    registrationReady,
    installHelp: isIos ? 'Safari 공유 버튼 → 홈 화면에 추가' : '브라우저 메뉴 → 앱 설치 또는 홈 화면에 추가',
  }
}
