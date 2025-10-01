"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const professionalCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border hover:shadow-md",
        elevated: "border-border shadow-md hover:shadow-lg",
        interactive: "border-border hover:shadow-md hover:border-primary/20 cursor-pointer",
        compact: "border-border shadow-sm",
      },
      status: {
        default: "",
        success: "border-green-200 bg-green-50/50",
        warning: "border-yellow-200 bg-yellow-50/50",
        error: "border-red-200 bg-red-50/50",
        info: "border-blue-200 bg-blue-50/50",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      status: "default",
      size: "md",
    },
  }
)

export interface ProfessionalCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof professionalCardVariants> {
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}

const ProfessionalCard = React.forwardRef<HTMLDivElement, ProfessionalCardProps>(
  ({ className, variant, status, size, loading, disabled, onClick, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(professionalCardVariants({ variant, status, size }), className)}
          {...props}
        >
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          professionalCardVariants({ variant, status, size }),
          "professional-card",
          disabled && "opacity-50 cursor-not-allowed",
          onClick && !disabled && "cursor-pointer",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ProfessionalCard.displayName = "ProfessionalCard"

const ProfessionalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-3", className)}
    {...props}
  />
))
ProfessionalCardHeader.displayName = "ProfessionalCardHeader"

const ProfessionalCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
ProfessionalCardTitle.displayName = "ProfessionalCardTitle"

const ProfessionalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ProfessionalCardDescription.displayName = "ProfessionalCardDescription"

const ProfessionalCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
ProfessionalCardContent.displayName = "ProfessionalCardContent"

const ProfessionalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-3", className)}
    {...props}
  />
))
ProfessionalCardFooter.displayName = "ProfessionalCardFooter"

export {
  ProfessionalCard,
  ProfessionalCardHeader,
  ProfessionalCardFooter,
  ProfessionalCardTitle,
  ProfessionalCardDescription,
  ProfessionalCardContent,
}
