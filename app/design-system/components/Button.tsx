'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  loading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "h-12 px-6 rounded-lg font-mono transition-colors flex items-center justify-center"
  const variantStyles = {
    primary: "bg-[#FF373A] text-white hover:bg-[#FF373A]/90",
    secondary: "bg-[#F4F2F8] text-[#FF373A] border border-[#FF373A]/20 hover:border-[#FF373A]"
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  )
} 