import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0070d1] text-white hover:bg-[#0064b7] active:bg-[#004d8d]",
        destructive:
          "bg-[#d53b00] text-white hover:bg-[#aa2f00]",
        outline:
          "border border-white/20 bg-transparent text-white hover:bg-white/10",
        "outline-light":
          "border border-black/20 bg-transparent text-black hover:bg-black/5",
        secondary:
          "bg-[#f3f3f3] text-black hover:bg-[#e5e5e5]",
        ghost:
          "hover:bg-white/10 hover:text-white",
        link:
          "text-[#0070d1] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-7 py-3 text-lg",
        sm: "h-9 rounded-full px-4 text-sm",
        lg: "h-14 rounded-full px-10 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
