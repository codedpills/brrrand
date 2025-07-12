import React, { useState } from 'react'
import { Search, Palette, Type, Image, Download, Sparkles } from 'lucide-react'
import { validateUrl } from '../utils/urlValidation'

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationError(null)
    
    // Validate the URL
    const validation = validateUrl(url)
    
    if (!validation.isValid) {
      setValidationError(validation.error)
      setIsValidating(false)
      return
    }
    
    // TODO: Implement asset extraction with validated URL
    console.log('Extracting assets from:', validation.normalizedUrl)
    console.log('Domain:', validation.domain)
    setIsValidating(false)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }

  const features = [
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

  return (
    <div data-testid="landing-page" className="min-h-screen bg-white px-4 py-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-gray-900 mb-4">
            Extract Brand Assets{' '}
            <span className="text-primary-500">Instantly</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            Get client brand assets instantly - no more email chains
          </p>
          <p className="text-lg text-gray-500">
            Free to use • No storage required • Instant results
          </p>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="max-w-2xl mx-auto">
            <label htmlFor="website-url" className="sr-only">
              Website URL
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="website-url"
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://example.com"
                  className={`w-full pl-10 pr-4 py-4 text-lg border-2 rounded-lg focus:ring-2 focus:ring-primary-200 outline-none transition-colors ${
                    validationError 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-primary-500'
                  }`}
                  required
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {validationError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isValidating}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                  isValidating
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                <Download className="w-5 h-5" />
                {isValidating ? 'Validating...' : 'Extract Assets'}
              </button>
            </div>
          </div>
        </form>

        {/* Features Grid */}
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

        {/* How it Works */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paste URL</h3>
              <p className="text-gray-600 text-sm">
                Enter any company website URL
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Extracts</h3>
              <p className="text-gray-600 text-sm">
                Our AI finds all brand assets automatically
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-gray-600 text-sm">
                Get organized assets ready for your projects
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-center text-sm text-gray-500 border-t pt-8">
          <p>
            <strong>Disclaimer:</strong> We don't own the content or assets generated. 
            All extracted assets remain the property of their original owners. 
            This tool is intended for legitimate design and marketing purposes only.
          </p>
        </div>
      </div>
    </div>
  )
}
