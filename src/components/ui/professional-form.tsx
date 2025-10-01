"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ActionButton } from "@/components/ui/action-button"
import { LoadingState } from "@/components/ui/loading-state"
import { CheckCircle, AlertCircle, Save, X } from "lucide-react"

const professionalFormVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        vertical: "flex-col",
        horizontal: "flex-row space-x-4",
        inline: "flex-row items-center space-x-4",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      layout: "vertical",
      size: "md",
    },
  }
)

export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "tel" | "textarea" | "select" | "checkbox" | "radio" | "date"
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
  }
  helpText?: string
  group?: string
}

export interface FormSection {
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
}

export interface ProfessionalFormProps
  extends React.FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof professionalFormVariants> {
  fields?: FormField[]
  sections?: FormSection[]
  initialValues?: Record<string, any>
  onSubmit?: (values: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  autoSave?: boolean
  autoSaveInterval?: number
  showProgress?: boolean
  showValidation?: boolean
  submitLabel?: string
  cancelLabel?: string
  successMessage?: string
  errorMessage?: string
}

export function ProfessionalForm({
  className,
  layout,
  size,
  fields = [],
  sections = [],
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  autoSave = false,
  autoSaveInterval = 30000,
  showProgress = false,
  showValidation = true,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  successMessage = "Form saved successfully",
  errorMessage = "Failed to save form",
  ...props
}: ProfessionalFormProps) {
  const [values, setValues] = React.useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [progress, setProgress] = React.useState(0)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave || !onSubmit) return

    const interval = setInterval(async () => {
      if (Object.keys(values).length > 0 && !isSubmitting) {
        try {
          await onSubmit(values)
          setLastSaved(new Date())
        } catch (error) {
          console.error("Auto-save failed:", error)
        }
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, autoSaveInterval, values, onSubmit, isSubmitting])

  // Progress calculation
  React.useEffect(() => {
    if (!showProgress) return

    const allFields = sections.length > 0 
      ? sections.flatMap(section => section.fields)
      : fields

    const requiredFields = allFields.filter(field => field.required)
    const completedFields = requiredFields.filter(field => 
      values[field.name] !== undefined && values[field.name] !== ""
    )

    setProgress((completedFields.length / requiredFields.length) * 100)
  }, [values, fields, sections, showProgress])

  const validateField = (field: FormField, value: any): string | null => {
    if (!field.validation) return null

    const { required, minLength, maxLength, pattern, custom } = field.validation

    if (required && (!value || value.toString().trim() === "")) {
      return `${field.label} is required`
    }

    if (minLength && value && value.toString().length < minLength) {
      return `${field.label} must be at least ${minLength} characters`
    }

    if (maxLength && value && value.toString().length > maxLength) {
      return `${field.label} must be no more than ${maxLength} characters`
    }

    if (pattern && value && !pattern.test(value.toString())) {
      return `${field.label} format is invalid`
    }

    if (custom) {
      return custom(value)
    }

    return null
  }

  const validateForm = (): boolean => {
    const allFields = sections.length > 0 
      ? sections.flatMap(section => section.fields)
      : fields

    const newErrors: Record<string, string> = {}

    allFields.forEach(field => {
      const error = validateField(field, values[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleFieldBlur = (field: FormField) => {
    setTouched(prev => ({ ...prev, [field.name]: true }))
    
    if (showValidation) {
      const error = validateField(field, values[field.name])
      setErrors(prev => ({ ...prev, [field.name]: error || "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !onSubmit) return

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      await onSubmit(values)
      setSubmitStatus("success")
      setLastSaved(new Date())
    } catch (error) {
      setSubmitStatus("error")
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const hasError = touched[field.name] && errors[field.name]
    const fieldId = `field-${field.name}`

    const commonProps = {
      id: fieldId,
      name: field.name,
      value: values[field.name] || "",
      onChange: (e: any) => handleFieldChange(field.name, e.target?.value || e),
      onBlur: () => handleFieldBlur(field),
      disabled: field.disabled || loading,
      placeholder: field.placeholder,
      className: cn(
        hasError && "border-red-500 focus:border-red-500 focus:ring-red-500"
      ),
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={fieldId} className={cn(field.required && "after:content-['*'] after:text-red-500 after:ml-1")}>
          {field.label}
        </Label>
        
        {field.type === "textarea" ? (
          <Textarea {...commonProps} />
        ) : field.type === "select" ? (
          <Select value={values[field.name] || ""} onValueChange={(value) => handleFieldChange(field.name, value)}>
            <SelectTrigger className={cn(hasError && "border-red-500")}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "checkbox" ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={values[field.name] || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              disabled={field.disabled || loading}
            />
            <Label htmlFor={fieldId}>{field.label}</Label>
          </div>
        ) : field.type === "radio" ? (
          <RadioGroup
            value={values[field.name] || ""}
            onValueChange={(value) => handleFieldChange(field.name, value)}
            disabled={field.disabled || loading}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                <Label htmlFor={`${fieldId}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Input {...commonProps} type={field.type} />
        )}
        
        {hasError && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors[field.name]}
          </p>
        )}
        
        {field.helpText && !hasError && (
          <p className="text-sm text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    )
  }

  const renderSection = (section: FormSection) => (
    <div key={section.title} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{section.title}</h3>
        {section.description && (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.fields.map(renderField)}
      </div>
      
      <Separator />
    </div>
  )

  if (loading) {
    return <LoadingState variant="skeleton" size="lg" />
  }

  return (
    <form onSubmit={handleSubmit} className={cn(professionalFormVariants({ layout, size }), className)} {...props}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Form Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Auto-save indicator */}
      {autoSave && lastSaved && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Save className="h-3 w-3 mr-1" />
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Form Content */}
      {sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(renderField)}
        </div>
      )}

      {/* Submit Status */}
      {submitStatus === "success" && (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          {successMessage}
        </div>
      )}

      {submitStatus === "error" && (
        <div className="flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          {errorMessage}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            {cancelLabel}
          </Button>
        )}
        
        <ActionButton
          type="submit"
          loading={isSubmitting}
          success={submitStatus === "success"}
          error={submitStatus === "error"}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {submitLabel}
        </ActionButton>
      </div>
    </form>
  )
}


