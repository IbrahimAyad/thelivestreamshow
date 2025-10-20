import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock navigator.mediaDevices for microphone access
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => []
    } as any)),
    enumerateDevices: vi.fn(() => Promise.resolve([
      {
        deviceId: 'test-mic-1',
        groupId: 'test-group',
        kind: 'audioinput' as MediaDeviceKind,
        label: 'Test Microphone 1',
        toJSON: () => ({})
      },
      {
        deviceId: 'test-mic-2',
        groupId: 'test-group',
        kind: 'audioinput' as MediaDeviceKind,
        label: 'Test Microphone 2',
        toJSON: () => ({})
      }
    ]))
  }
})

// Suppress console errors during tests (optional)
// global.console = {
//   ...console,
//   error: vi.fn(),
//   warn: vi.fn(),
// }
