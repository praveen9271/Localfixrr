import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { isAuthenticated, isUser } from '../services/authService'

function useProtectedBooking({ onToast, redirectDelay = 1000 } = {}) {
  const navigate = useNavigate()
  const redirectTimerRef = useRef(null)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  const clearRedirectTimer = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
  }

  useEffect(() => clearRedirectTimer, [])

  const goToLogin = () => {
    clearRedirectTimer()
    setLoginPromptOpen(false)
    navigate('/login')
  }

  const closeLoginPrompt = () => {
    clearRedirectTimer()
    setLoginPromptOpen(false)
  }

  const requestBooking = (openBooking) => {
    if (!isAuthenticated()) {
      onToast?.('Please sign in to book a service.')
      setLoginPromptOpen(true)
      clearRedirectTimer()
      redirectTimerRef.current = setTimeout(() => {
        goToLogin()
      }, redirectDelay)
      return false
    }

    if (!isUser()) {
      onToast?.('Only customer accounts can book services.')
      return false
    }

    openBooking?.()
    return true
  }

  return {
    closeLoginPrompt,
    goToLogin,
    loginPromptOpen,
    requestBooking,
  }
}

export default useProtectedBooking
