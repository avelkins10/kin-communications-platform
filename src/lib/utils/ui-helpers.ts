import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color calculations for priority systems
export function getPriorityColor(priority: "urgent" | "high" | "normal" | "low") {
  const colors = {
    urgent: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "ring-red-500",
    },
    high: {
      text: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      ring: "ring-yellow-500",
    },
    normal: {
      text: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      ring: "ring-green-500",
    },
    low: {
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      ring: "ring-blue-500",
    },
  }
  return colors[priority]
}

export function getStatusColor(status: "pending" | "in-progress" | "completed" | "escalated") {
  const colors = {
    pending: {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    "in-progress": {
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    completed: {
      text: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    escalated: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  }
  return colors[status]
}

// Animation helpers for smooth transitions
export function getTransitionClasses(duration: number = 200) {
  return `transition-all duration-${duration} ease-in-out`
}

export function getHoverClasses() {
  return "hover:shadow-md hover:scale-[1.02] transform"
}

export function getFocusClasses() {
  return "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
}


export function getShakeClasses() {
  return "animate-shake"
}

export function getBounceClasses() {
  return "animate-bounce"
}

// Accessibility utilities
export function getAriaLabel(text: string, context?: string) {
  return context ? `${text} ${context}` : text
}

export function getScreenReaderText(text: string) {
  return <span className="sr-only">{text}</span>
}

export function getHighContrastClasses() {
  return "contrast-more:border-2 contrast-more:border-black"
}

export function getReducedMotionClasses() {
  return "motion-reduce:transition-none motion-reduce:animate-none"
}

// Responsive design helpers
export function getResponsiveSpacing(base: string, sm?: string, md?: string, lg?: string) {
  const classes = [base]
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  return classes.join(" ")
}

export function getResponsiveGrid(cols: { base: number; sm?: number; md?: number; lg?: number }) {
  const classes = [`grid-cols-${cols.base}`]
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
  return classes.join(" ")
}

export function getResponsiveText(size: { base: string; sm?: string; md?: string; lg?: string }) {
  const classes = [`text-${size.base}`]
  if (size.sm) classes.push(`sm:text-${size.sm}`)
  if (size.md) classes.push(`md:text-${size.md}`)
  if (size.lg) classes.push(`lg:text-${size.lg}`)
  return classes.join(" ")
}

// Consistent spacing utilities
export function getSpacingClasses(space: "xs" | "sm" | "md" | "lg" | "xl") {
  const spacing = {
    xs: "space-y-1",
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
    xl: "space-y-8",
  }
  return spacing[space]
}

export function getPaddingClasses(size: "xs" | "sm" | "md" | "lg" | "xl") {
  const padding = {
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }
  return padding[size]
}

export function getMarginClasses(size: "xs" | "sm" | "md" | "lg" | "xl") {
  const margin = {
    xs: "m-1",
    sm: "m-2",
    md: "m-4",
    lg: "m-6",
    xl: "m-8",
  }
  return margin[size]
}

// Focus state management
export function getFocusVisibleClasses() {
  return "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
}

export function getFocusWithinClasses() {
  return "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
}

// Business data formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function formatTimestamp(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (hours > 24) {
    return d.toLocaleDateString()
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return "Just now"
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Loading state helpers
export function getLoadingClasses(variant: "skeleton" | "spinner" | "pulse" = "pulse") {
  const classes = {
    skeleton: "animate-pulse bg-muted rounded",
    spinner: "animate-spin",
    pulse: "animate-pulse",
  }
  return classes[variant]
}

export function getErrorClasses() {
  return "border-red-500 bg-red-50 text-red-900"
}

export function getSuccessClasses() {
  return "border-green-500 bg-green-50 text-green-900"
}

export function getWarningClasses() {
  return "border-yellow-500 bg-yellow-50 text-yellow-900"
}

export function getInfoClasses() {
  return "border-blue-500 bg-blue-50 text-blue-900"
}

// Keyboard shortcuts
export function getKeyboardShortcutDisplay(shortcut: string): string {
  return shortcut
    .split("+")
    .map(key => key.trim().toUpperCase())
    .join(" + ")
}

export function parseKeyboardShortcut(shortcut: string): {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
} {
  const parts = shortcut.toLowerCase().split("+").map(p => p.trim())
  
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
  }
}

// Contrast ratio calculation
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd convert hex colors to RGB and calculate luminance
  const contrastRatios: Record<string, number> = {
    "red-600": 4.5,
    "yellow-600": 4.2,
    "green-600": 4.8,
    "blue-600": 4.3,
    "white": 1,
    "black": 21,
  }
  
  return contrastRatios[color1] || 4.5
}

export function getAccessibleTextColor(backgroundColor: string): string {
  const contrast = getContrastRatio(backgroundColor, "white")
  return contrast >= 4.5 ? "text-white" : "text-black"
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\D/g, ""))
}

export function validateRequired(value: any): boolean {
  return value !== undefined && value !== null && value !== ""
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

// Performance optimization helpers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Local storage helpers
export function saveToLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
    return defaultValue
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error("Failed to remove from localStorage:", error)
  }
}
