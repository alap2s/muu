'use client'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          height: 48,
          paddingLeft: 16,
          paddingRight: 16,
          background: 'var(--background-secondary)',
          border: '1px solid var(--border-main)',
          borderRadius: 8,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--text-primary)',
          fontSize: 16,
          outline: 'none',
        }}
        className={className}
        placeholder={props.placeholder}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#f87171' }}>{error}</p>
      )}
    </div>
  )
} 