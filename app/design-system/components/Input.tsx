'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono text-[#E34114] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-[#F4F2F8] border border-[#E34114]/20 rounded-lg font-mono text-[#E34114] placeholder:text-[#E34114]/50 focus:outline-none focus:border-[#E34114] transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 