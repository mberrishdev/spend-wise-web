import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, style, color = "bg-green-500", ...props }, ref) => {
  // Check if color is a hex code or CSS color
  const isColorCode = color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl');
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", !isColorCode && color)}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: isColorCode ? color : (style?.background || undefined),
          ...style,
        }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
