import React, { useState } from 'react'
import { Search, Palette, Type, Image, Download, Sparkles, ExternalLink, Copy } from 'lucide-react'
import { validateUrl } from '../utils/urlValidation'
import { extractAssets, type ExtractedAssets, type AssetExtractionResult } from '../utils/assetExtraction'

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<AssetExtractionResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationError(null)
    setExtractionResult(null)
    
    // Validate the URL
    const validation = validateUrl(url)
    
    if (!validation.isValid) {
      setValidationError(validation.error)
      setIsValidating(false)
      return
    }
    
    setIsValidating(false)
    setIsExtracting(true)
    
    try {
      console.log('Extracting assets from:', validation.normalizedUrl)
      console.log('Domain:', validation.domain)
      
      const result = await extractAssets(validation.normalizedUrl!)
      setExtractionResult(result)
      
      if (!result.success) {
        setValidationError(result.error || 'Failed to extract assets')
      }
    } catch (error) {
      console.error('Asset extraction failed:', error)
      setValidationError('An unexpected error occurred. Please try again.')
    } finally {
      setIsExtracting(false)
    }
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
        <form onSubmit={handleSubmit} noValidate className="mb-12">
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
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {validationError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isValidating || isExtracting}
                className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                  isValidating || isExtracting
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                <Download className="w-5 h-5" />
                {isValidating ? 'Validating...' : isExtracting ? 'Extracting...' : 'Extract Assets'}
              </button>
            </div>
          </div>
        </form>

        {/* Results Section */}
        {extractionResult && (
          <div className="mb-12">
            {extractionResult.success ? (
              <div className="max-w-4xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Assets extracted successfully!
                      </h3>
                      <p className="text-green-700">
                        Found {extractionResult.assets!.logos.length} logos, {extractionResult.assets!.colors.length} colors, {extractionResult.assets!.fonts.length} fonts, and {extractionResult.assets!.illustrations.length} illustrations from {extractionResult.domain}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Asset Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Logos */}
                  {extractionResult.assets!.logos.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Image className="w-5 h-5 text-primary-500" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          Logos ({extractionResult.assets!.logos.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {extractionResult.assets!.logos.map((logo, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                            <img 
                              src={logo.url} 
                              alt={logo.alt || 'Logo'} 
                              className="w-full h-16 object-contain mb-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-gray-600 truncate" title={logo.url}>
                              {logo.alt || 'Logo'}
                            </p>
                            <a 
                              href={logo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {extractionResult.assets!.colors.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Palette className="w-5 h-5 text-primary-500" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          Colors ({extractionResult.assets!.colors.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {extractionResult.assets!.colors.slice(0, 12).map((color, index) => (
                          <div key={index} className="group cursor-pointer" onClick={() => {
                            if (color.value) {
                              navigator.clipboard.writeText(color.value)
                            }
                          }}>
                            <div 
                              className="w-full h-12 rounded-lg border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
                              style={{ backgroundColor: color.value }}
                              title={`Click to copy ${color.value}`}
                            />
                            <p className="text-xs text-gray-600 mt-1 text-center font-mono">
                              {color.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      {extractionResult.assets!.colors.length > 12 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          +{extractionResult.assets!.colors.length - 12} more colors
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fonts */}
                  {extractionResult.assets!.fonts.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Type className="w-5 h-5 text-primary-500" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          Fonts ({extractionResult.assets!.fonts.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {extractionResult.assets!.fonts.slice(0, 8).map((font, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                            <p className="font-semibold text-gray-900">{font.name}</p>
                            {font.url && (
                              <a 
                                href={font.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 mt-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Font
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      {extractionResult.assets!.fonts.length > 8 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          +{extractionResult.assets!.fonts.length - 8} more fonts
                        </p>
                      )}
                    </div>
                  )}

                  {/* Illustrations */}
                  {extractionResult.assets!.illustrations.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          Illustrations ({extractionResult.assets!.illustrations.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {extractionResult.assets!.illustrations.slice(0, 6).map((illustration, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                            <img 
                              src={illustration.url} 
                              alt={illustration.alt || 'Illustration'} 
                              className="w-full h-20 object-cover rounded mb-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-gray-600 truncate" title={illustration.url}>
                              {illustration.alt || 'Illustration'}
                            </p>
                            <a 
                              href={illustration.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                          </div>
                        ))}
                      </div>
                      {extractionResult.assets!.illustrations.length > 6 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          +{extractionResult.assets!.illustrations.length - 6} more illustrations
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">!</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">
                        Unable to extract assets
                      </h3>
                      <p className="text-red-700">
                        {extractionResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
