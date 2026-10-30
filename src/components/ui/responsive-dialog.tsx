import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsiveDialogProps extends React.ComponentProps<typeof Dialog> {
  children: React.ReactNode
}

function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <Drawer {...props}>{children}</Drawer>
  }

  return <Dialog {...props}>{children}</Dialog>
}

const ResponsiveDialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogTrigger>,
  React.ComponentPropsWithoutRef<typeof DialogTrigger>
>(({ children, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerTrigger ref={ref} {...props}>
        {children}
      </DrawerTrigger>
    )
  }

  return (
    <DialogTrigger ref={ref} {...props}>
      {children}
    </DialogTrigger>
  )
})
ResponsiveDialogTrigger.displayName = "ResponsiveDialogTrigger"

const ResponsiveDialogClose = React.forwardRef<
  React.ElementRef<typeof DialogClose>,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ children, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerClose ref={ref} {...props}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose ref={ref} {...props}>
      {children}
    </DialogClose>
  )
})
ResponsiveDialogClose.displayName = "ResponsiveDialogClose"

interface ResponsiveDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  children: React.ReactNode
}

const ResponsiveDialogContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveDialogContentProps
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent ref={ref} className={cn("max-h-[85vh] pb-safe flex flex-col", className)} {...props}>
        <div className="overflow-y-auto px-4 pb-4 pt-1 flex-1 flex flex-col gap-4">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent ref={ref} className={className} {...props}>
      {children}
    </DialogContent>
  )
})
ResponsiveDialogContent.displayName = "ResponsiveDialogContent"

function ResponsiveDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerHeader className={cn("px-0 text-left", className)} {...props} />
  }

  return <DialogHeader className={className} {...props} />
}
ResponsiveDialogHeader.displayName = "ResponsiveDialogHeader"

function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerFooter className={cn("px-0 pt-2 flex flex-col gap-2", className)} {...props} />
  }

  return <DialogFooter className={className} {...props} />
}
ResponsiveDialogFooter.displayName = "ResponsiveDialogFooter"

const ResponsiveDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerTitle ref={ref} className={className} {...props} />
  }

  return <DialogTitle ref={ref} className={className} {...props} />
})
ResponsiveDialogTitle.displayName = "ResponsiveDialogTitle"

const ResponsiveDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DrawerDescription ref={ref} className={className} {...props} />
  }

  return <DialogDescription ref={ref} className={className} {...props} />
})
ResponsiveDialogDescription.displayName = "ResponsiveDialogDescription"

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
}
