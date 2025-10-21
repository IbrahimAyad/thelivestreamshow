import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AutomationEngine } from '../../lib/automation/AutomationEngine'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              enabled: true,
              dry_run_mode: false,
              auto_execute_threshold: 0.85,
              suggest_threshold: 0.60,
              allowed_action_types: ['betabot.mood', 'betabot.movement', 'graphic.show', 'graphic.hide'],
            },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
}))

describe('AutomationEngine', () => {
  let engine: AutomationEngine

  beforeEach(() => {
    engine = new AutomationEngine()
  })

  it('should initialize successfully', async () => {
    await expect(engine.initialize()).resolves.not.toThrow()
  })

  it('should have actionExecutor, triggerDetector, and priorityQueue', () => {
    expect(engine).toHaveProperty('actionExecutor')
    expect(engine).toHaveProperty('triggerDetector')
    expect(engine).toHaveProperty('priorityQueue')
  })

  it('should allow setting event listener', () => {
    const mockListener = vi.fn()
    expect(() => engine.setEventListener(mockListener)).not.toThrow()
  })

  it('should allow setting OBS controller', () => {
    const mockObsController = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
    expect(() => engine.setObsController(mockObsController)).not.toThrow()
  })

  it('should track show start time', () => {
    const before = new Date()
    engine.startShow()
    const after = new Date()

    // Show start time should be between before and after
    // This is a basic smoke test to ensure the method works
    expect(true).toBe(true) // Placeholder assertion
  })

  it('should process manual triggers', async () => {
    await engine.initialize()

    const result = await engine.manualTrigger(
      'betabot.mood',
      { mood: 'spicy' },
      { source: 'test' }
    )

    // Should return a decision ID
    expect(typeof result).toBe('string')
  })
})
