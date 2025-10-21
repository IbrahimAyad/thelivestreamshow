import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const baseStyles = 'flex h-10 w-full rounded-md border-2 border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

    return (
      <input
        type={type}
        className={`${baseStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
