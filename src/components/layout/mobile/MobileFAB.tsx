import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MobileFABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  label?: string
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

export const MobileFAB = React.forwardRef<HTMLButtonElement, MobileFABProps>(
  ({ icon: Icon, label, onClick, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label || (typeof children === "string" ? children : "Aksi Utama")}
        className={cn(
          "fixed right-4 bottom-20 z-30 md:hidden",
          "size-12 min-h-[48px] min-w-[48px] rounded-full",
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
          "active:scale-95 transition-all duration-150 ease-out",
          "flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          Icon && <Icon className="size-6 text-inherit stroke-[2.25]" />
        )}
        {label && <span className="sr-only">{label}</span>}
      </button>
    )
  }
)

MobileFAB.displayName = "MobileFAB"
