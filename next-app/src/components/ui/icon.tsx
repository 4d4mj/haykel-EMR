import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import 'material-symbols';

const IconVariants = cva(
  "material-symbols-outlined transition-colors",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
        inherit: "",
      },
      iconStyle: { // Renamed from style to iconStyle to avoid conflict
        outlined: "material-symbols-outlined",
        rounded: "material-symbols-rounded",
        sharp: "material-symbols-sharp",
        filled: "material-symbols-filled",
      },
    },
    defaultVariants: {
      variant: "inherit",
      iconStyle: "outlined",
    },
  }
)

// Define Props interface using VariantProps
export interface IconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'>, // Omit the conflicting 'style' prop
    VariantProps<typeof IconVariants> {
  weight?: number;
  fill?: 0 | 1; // fill is 0 or 1 for Material Symbols
  grad?: number;
  opsz?: number;
  children: string; // Icon name as string
  // Allow style prop for React.CSSProperties
  style?: React.CSSProperties;
}

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({
    className,
    variant,
    iconStyle, // Use renamed iconStyle prop
    weight,
    fill,
    grad,
    opsz,
    children,
    style, // React.CSSProperties style prop
    ...props
  }, ref) => {
    // Create a string that combines all font-variation-settings
    const variationSettings: Record<string, string | number> = {};

    if (weight !== undefined) variationSettings.wght = weight;
    if (fill !== undefined) variationSettings.FILL = fill;
    if (grad !== undefined) variationSettings.GRAD = grad;
    if (opsz !== undefined) variationSettings.opsz = opsz;

    // Convert variation settings object to proper CSS font-variation-settings string
    const fontVariationStyle: React.CSSProperties = Object.keys(variationSettings).length
      ? {
          fontVariationSettings: Object.entries(variationSettings)
            .map(([token, value]) => `'${token}' ${value}`)
            .join(', ')
        }
      : {};

    return (
      <span
        className={cn(IconVariants({ variant, iconStyle, className }))} // Pass iconStyle to IconVariants
        style={{ ...fontVariationStyle, ...style }} // Merge fontVariationStyle with the passed style prop
        ref={ref} // Forward the ref
        {...props}
      >
        {children}
      </span>
    )
  }
)
Icon.displayName = "Icon" // Add display name

export { Icon, IconVariants }
