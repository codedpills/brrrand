import React from 'react'

interface HeroSectionProps {
  title: string
  subtitle: string
  description: string
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  description
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl md:text-6xl font-bold font-display text-gray-900 mb-4">
        {title}{' '}
        <span className="text-primary-500">Instantly</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-2">
        {subtitle}
      </p>
      <p className="text-lg text-gray-500">
        {description}
      </p>
    </div>
  )
}
