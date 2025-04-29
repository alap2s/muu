'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono text-[#FF373A] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-[#F4F2F8] border border-[#FF373A]/20 rounded-lg font-mono text-[#FF373A] placeholder:text-[#FF373A]/50 focus:outline-none focus:border-[#FF373A] transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 