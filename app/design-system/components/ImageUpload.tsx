'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X } from 'lucide-react'

interface ImageUploadProps {
  label?: string
  description?: string
  maxFiles?: number
  accept?: string
  onChange?: (files: File[]) => void
}

export function ImageUpload({
  label,
  description,
  maxFiles = 1,
  accept,
  onChange
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
    setFiles(newFiles)
    onChange?.(newFiles)

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }, [files, maxFiles, onChange])

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onChange?.(newFiles)

    // Remove preview
    URL.revokeObjectURL(previews[index])
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles
  })

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-mono text-[#FF373A] mb-2">
          {label}
        </label>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-[#FF373A]/20 rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#FF373A] bg-[#FF373A]/5' : 'hover:border-[#FF373A]/50'}`}
      >
        <input {...getInputProps()} />
        <p className="font-mono text-[#FF373A]/70">
          {isDragActive
            ? 'Drop the files here...'
            : description || 'Drag & drop files here, or click to select files'}
        </p>
      </div>

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={preview} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} className="text-[#FF373A]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 