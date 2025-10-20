import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickActions } from '../../components/QuickActions'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        neq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  },
}))

describe('QuickActions', () => {
  it('renders without crashing', () => {
    render(<QuickActions />)

    // Should render the component title or heading
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()
  })

  it('displays Hide All button', () => {
    render(<QuickActions />)

    // Use getAllByText since there might be multiple matches
    const hideAllElements = screen.getAllByText(/Hide All/i)
    expect(hideAllElements.length).toBeGreaterThan(0)
  })

  it('displays scene preset buttons', () => {
    render(<QuickActions />)

    // Check for preset buttons
    expect(screen.getByText(/Clean/i)).toBeInTheDocument()
    expect(screen.getByText(/Branded/i)).toBeInTheDocument()
  })

  it('has correct CSS classes for styling', () => {
    const { container } = render(<QuickActions />)

    // Should have a main container with proper styling
    const firstChild = container.firstChild as HTMLElement
    expect(firstChild).toHaveClass('bg-black')
  })
})
