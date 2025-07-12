import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('should render title with instant highlight', () => {
    render(
      <HeroSection 
        title="Extract Brand Assets"
        subtitle="Get client brand assets instantly"
        description="Free to use"
      />
    )
    
    expect(screen.getByText('Extract Brand Assets')).toBeInTheDocument()
    expect(screen.getByText('Instantly')).toBeInTheDocument()
    expect(screen.getByText('Get client brand assets instantly')).toBeInTheDocument()
    expect(screen.getByText('Free to use')).toBeInTheDocument()
  })
})
