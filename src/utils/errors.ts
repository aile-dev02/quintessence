export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class StorageError extends Error {
  type: string
  details?: Record<string, unknown>

  constructor(message: string, type: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'StorageError'
    this.type = type
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class FileProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileProcessingError'
  }
}