import React from 'react'
import { Image, Palette, Type, Sparkles } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <Image className="w-6 h-6" />,
    title: 'Logos',
    description: 'High-quality company logos in multiple formats'
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Colors',
    description: 'Complete brand color palettes with HEX codes'
  },
  {
    icon: <Type className="w-6 h-6" />,
    title: 'Typography',
    description: 'Font families and text styling information'
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Illustrations',
    description: 'Custom graphics and visual elements'
  }
]

export const FeaturesGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {features.map((feature, index) => (
        <div
          key={index}
          className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="text-primary-500 mb-4 flex justify-center">
            {feature.icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  )
}
