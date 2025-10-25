export interface FileValidationOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileValidationError'
  }
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): void {
  const {
    maxSizeMB = 100,
    allowedTypes = [],
    allowedExtensions = []
  } = options
  
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new FileValidationError(
      `File size exceeds ${maxSizeMB}MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    )
  }
  
  // Check MIME type
  if (allowedTypes.length > 0) {
    const matches = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const base = type.slice(0, -2)
        return file.type.startsWith(base)
      }
      return file.type === type
    })
    
    if (!matches) {
      throw new FileValidationError(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      )
    }
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new FileValidationError(
        `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
      )
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}
