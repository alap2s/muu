'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono text-primary mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-background-secondary border border-primary/20 rounded-lg font-mono text-black placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 