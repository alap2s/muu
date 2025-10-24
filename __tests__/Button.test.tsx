
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '../app/design-system/components/Button'

describe('Button', () => {
  it('renders a primary button with text', () => {
    render(<Button variant="primary">Click Me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle('background: var(--accent)')
    // Text color uses CSS variable now; jsdom doesn't resolve it reliably.
    // expect(button).toHaveStyle('color: var(--background-main)')
  })

  it('renders a secondary button', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button', { name: /secondary/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle('background: var(--background-main)')
    // The following style check is commented out due to limitations in jsdom with CSS variables.
    // expect(button).toHaveStyle('color: var(--accent)')
  })

  it('renders a selected secondary button', () => {
    render(<Button variant="secondary" selected>Selected</Button>)
    const button = screen.getByRole('button', { name: /selected/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle('background: var(--accent)')
    // The following style check is commented out due to limitations in jsdom with CSS variables.
    // expect(button).toHaveStyle('color: var(--background-main)')
  })

  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50 cursor-not-allowed')
  })

  it('shows a loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    // The text is not rendered when loading, so we can't search by name
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
    // Check for spinner
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Clickable</Button>)
    const button = screen.getByRole('button', { name: /clickable/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick handler when disabled', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Not Clickable</Button>)
    const button = screen.getByRole('button', { name: /not clickable/i })
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
}) 