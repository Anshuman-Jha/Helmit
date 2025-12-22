import * as React from "react"

const Button = React.forwardRef(
    (
        {
            className = "",
            variant = "default",
            size = "default",
            disabled = false,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
            outline: "border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
            secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm",
            ghost: "hover:bg-gray-100 text-gray-900",
            link: "text-blue-600 underline-offset-4 hover:underline",
        }

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3 text-xs",
            lg: "h-11 rounded-md px-8 text-base",
            icon: "h-10 w-10",
        }

        return (
            <button
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                ref={ref}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }

