import * as React from "react"

import { cn } from "#/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-sm border border-[#cccccc] bg-white px-4 py-3 text-base text-black ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-black/30 focus-visible:outline-none focus-visible:border-2 focus-visible:border-[#0070d1] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-[#121314] dark:text-white dark:placeholder:text-white/30 dark:ring-offset-black",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
