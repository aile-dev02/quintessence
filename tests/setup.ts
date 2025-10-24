import { beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock IndexedDB
const mockIDBFactory = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIDBFactory,
  writable: true,
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global test setup
beforeEach(() => {
  // Reset localStorage mock
  vi.mocked(localStorage.getItem).mockReturnValue(null)
  vi.mocked(localStorage.setItem).mockImplementation(() => {})
  vi.mocked(localStorage.removeItem).mockImplementation(() => {})
  vi.mocked(localStorage.clear).mockImplementation(() => {})
})