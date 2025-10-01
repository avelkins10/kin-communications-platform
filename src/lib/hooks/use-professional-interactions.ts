"use client"

import * as React from "react"
import { useSocket } from "@/components/socket-provider"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { toast } from "sonner"

export interface InteractionState {
  loading: boolean
  success: boolean
  error: boolean
  message?: string
}

export interface ButtonState extends InteractionState {
  disabled: boolean
}

export interface FormState extends InteractionState {
  touched: Record<string, boolean>
  errors: Record<string, string>
  values: Record<string, any>
}

export interface NotificationState {
  show: boolean
  type: "info" | "success" | "warning" | "error"
  message: string
  duration?: number
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  action: () => void
  description?: string
}

export function useProfessionalInteractions() {
  const { socket } = useSocket()
  const [interactionHistory, setInteractionHistory] = React.useState<Array<{
    id: string
    type: string
    timestamp: Date
    success: boolean
    duration: number
  }>>([])

  // Button state management
  const useButtonState = (initialState: Partial<ButtonState> = {}) => {
    const [state, setState] = React.useState<ButtonState>({
      loading: false,
      success: false,
      error: false,
      disabled: false,
      ...initialState,
    })

    const setLoading = (loading: boolean) => {
      setState(prev => ({ ...prev, loading, success: false, error: false }))
    }

    const setSuccess = (success: boolean, message?: string) => {
      setState(prev => ({ ...prev, success, loading: false, error: false, message }))
      if (success && message) {
        toast.success(message)
      }
    }

    const setError = (error: boolean, message?: string) => {
      setState(prev => ({ ...prev, error, loading: false, success: false, message }))
      if (error && message) {
        toast.error(message)
      }
    }

    const setDisabled = (disabled: boolean) => {
      setState(prev => ({ ...prev, disabled }))
    }

    const reset = () => {
      setState({
        loading: false,
        success: false,
        error: false,
        disabled: false,
      })
    }

    const executeWithState = async (action: () => Promise<void> | void) => {
      if (state.disabled || state.loading) return

      const startTime = Date.now()
      setLoading(true)

      try {
        await action()
        const duration = Date.now() - startTime
        setSuccess(true, "Action completed successfully")
        
        // Track interaction
        setInteractionHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          type: "button_action",
          timestamp: new Date(),
          success: true,
          duration,
        }, ...prev.slice(0, 49)])
      } catch (error) {
        const duration = Date.now() - startTime
        setError(true, error instanceof Error ? error.message : "Action failed")
        
        // Track interaction
        setInteractionHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          type: "button_action",
          timestamp: new Date(),
          success: false,
          duration,
        }, ...prev.slice(0, 49)])
      }
    }

    return {
      state,
      setLoading,
      setSuccess,
      setError,
      setDisabled,
      reset,
      executeWithState,
    }
  }

  // Form state management
  const useFormState = (initialValues: Record<string, any> = {}) => {
    const [state, setState] = React.useState<FormState>({
      loading: false,
      success: false,
      error: false,
      touched: {},
      errors: {},
      values: initialValues,
    })

    const setFieldValue = (name: string, value: any) => {
      setState(prev => ({
        ...prev,
        values: { ...prev.values, [name]: value },
        errors: { ...prev.errors, [name]: "" },
      }))
    }

    const setFieldTouched = (name: string, touched: boolean = true) => {
      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [name]: touched },
      }))
    }

    const setFieldError = (name: string, error: string) => {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error },
      }))
    }

    const setLoading = (loading: boolean) => {
      setState(prev => ({ ...prev, loading, success: false, error: false }))
    }

    const setSuccess = (success: boolean, message?: string) => {
      setState(prev => ({ ...prev, success, loading: false, error: false, message }))
      if (success && message) {
        toast.success(message)
      }
    }

    const setError = (error: boolean, message?: string) => {
      setState(prev => ({ ...prev, error, loading: false, success: false, message }))
      if (error && message) {
        toast.error(message)
      }
    }

    const reset = () => {
      setState({
        loading: false,
        success: false,
        error: false,
        touched: {},
        errors: {},
        values: initialValues,
      })
    }

    return {
      state,
      setFieldValue,
      setFieldTouched,
      setFieldError,
      setLoading,
      setSuccess,
      setError,
      reset,
    }
  }

  // Notification management
  const useNotification = () => {
    const [state, setState] = React.useState<NotificationState>({
      show: false,
      type: "info",
      message: "",
    })

    const show = (type: NotificationState["type"], message: string, duration = 5000) => {
      setState({ show: true, type, message, duration })
      
      // Auto-hide after duration
      setTimeout(() => {
        setState(prev => ({ ...prev, show: false }))
      }, duration)
    }

    const hide = () => {
      setState(prev => ({ ...prev, show: false }))
    }

    const showSuccess = (message: string, duration?: number) => {
      show("success", message, duration)
    }

    const showError = (message: string, duration?: number) => {
      show("error", message, duration)
    }

    const showWarning = (message: string, duration?: number) => {
      show("warning", message, duration)
    }

    const showInfo = (message: string, duration?: number) => {
      show("info", message, duration)
    }

    return {
      state,
      show,
      hide,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }
  }

  // Keyboard shortcuts
  const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Don't trigger if user is typing in an input
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return
        }

        const matchingShortcut = shortcuts.find(shortcut => {
          const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
          const ctrlMatch = !!shortcut.ctrl === event.ctrlKey
          const altMatch = !!shortcut.alt === event.altKey
          const shiftMatch = !!shortcut.shift === event.shiftKey

          return keyMatch && ctrlMatch && altMatch && shiftMatch
        })

        if (matchingShortcut) {
          event.preventDefault()
          matchingShortcut.action()
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [shortcuts])
  }

  // Focus management
  const useFocusManagement = () => {
    const focusElement = (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        element.focus()
      }
    }

    const focusNext = (currentSelector: string) => {
      const current = document.querySelector(currentSelector) as HTMLElement
      if (current) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const currentIndex = Array.from(focusableElements).indexOf(current)
        const nextElement = focusableElements[currentIndex + 1] as HTMLElement
        if (nextElement) {
          nextElement.focus()
        }
      }
    }

    const focusPrevious = (currentSelector: string) => {
      const current = document.querySelector(currentSelector) as HTMLElement
      if (current) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const currentIndex = Array.from(focusableElements).indexOf(current)
        const previousElement = focusableElements[currentIndex - 1] as HTMLElement
        if (previousElement) {
          previousElement.focus()
        }
      }
    }

    return {
      focusElement,
      focusNext,
      focusPrevious,
    }
  }

  // Real-time updates with throttling
  const useThrottledUpdates = (callback: () => void, delay: number = 1000) => {
    const [lastUpdate, setLastUpdate] = React.useState<number>(0)

    const throttledCallback = React.useCallback(() => {
      const now = Date.now()
      if (now - lastUpdate >= delay) {
        callback()
        setLastUpdate(now)
      }
    }, [callback, delay, lastUpdate])

    return throttledCallback
  }

  // Error recovery
  const useErrorRecovery = (retryAction: () => Promise<void>, maxRetries: number = 3) => {
    const [retryCount, setRetryCount] = React.useState(0)
    const [isRetrying, setIsRetrying] = React.useState(false)

    const retry = async () => {
      if (retryCount >= maxRetries || isRetrying) return

      setIsRetrying(true)
      try {
        await retryAction()
        setRetryCount(0)
        toast.success("Operation recovered successfully")
      } catch (error) {
        setRetryCount(prev => prev + 1)
        toast.error(`Retry ${retryCount + 1} failed. ${maxRetries - retryCount - 1} attempts remaining.`)
      } finally {
        setIsRetrying(false)
      }
    }

    const reset = () => {
      setRetryCount(0)
      setIsRetrying(false)
    }

    return {
      retryCount,
      isRetrying,
      retry,
      reset,
      canRetry: retryCount < maxRetries,
    }
  }

  // Interaction analytics
  const getInteractionStats = () => {
    const total = interactionHistory.length
    const successful = interactionHistory.filter(i => i.success).length
    const failed = total - successful
    const avgDuration = interactionHistory.reduce((sum, i) => sum + i.duration, 0) / total || 0

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration,
    }
  }

  return {
    useButtonState,
    useFormState,
    useNotification,
    useKeyboardShortcuts,
    useFocusManagement,
    useThrottledUpdates,
    useErrorRecovery,
    getInteractionStats,
    interactionHistory,
  }
}
