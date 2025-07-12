import React, { useState } from 'react'
import { Search, Palette, Type, Image, Download, Sparkles, ExternalLink, Copy, Archive } from 'lucide-react'
import { validateUrl } from '../utils/urlValidation'
import { extractAssets, type AssetExtractionResult } from '../utils/assetExtraction'
import { mockExtractAssets, suggestedTestSites } from '../utils/mockAssetExtraction'

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<AssetExtractionResult | null>(null)
  
  const defaultDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === undefined
  const [isDemoMode, setIsDemoMode] = useState(defaultDemoMode)
  
  // Show demo toggle in development or when explicitly enabled
  const showDemoToggle = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_TOGGLE === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationError(null)
    setExtractionResult(null)
    
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
      console.log('Demo mode:', isDemoMode)
      
      // Use mock extraction in demo mode to avoid CORS
      const result = isDemoMode 
        ? await mockExtractAssets(validation.normalizedUrl!)
        : await extractAssets(validation.normalizedUrl!)
      
      setExtractionResult(result)
      
      if (!result.success) {
        setValidationError(result.error || 'Failed to extract assets')
      }
    } catch (error) {
      console.error('Asset extraction failed:', error)
      if (error instanceof TypeError && error.message.includes('CORS')) {
        setValidationError('CORS error: Enable Demo Mode to test asset extraction, or use a CORS proxy for real websites.')
      } else {
        setValidationError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDemoSiteClick = (siteUrl: string) => {
    setUrl(siteUrl)
    setValidationError(null)
    setExtractionResult(null)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (validationError) {
      setValidationError(null)
    }
  }

  // Download utility functions
  const downloadAsset = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' })
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(url, '_blank')
    }
  }

  const downloadAllAssets = async () => {
    if (!extractionResult?.assets) return

    const { logos, colors, fonts, illustrations } = extractionResult.assets
    const domain = extractionResult.domain || 'assets'

    // Create a text file with asset information
    let assetsText = `Brand Assets from ${domain}\n`
    assetsText += `Generated on ${new Date().toLocaleString()}\n\n`

    if (logos.length > 0) {
      assetsText += `LOGOS (${logos.length}):\n`
      logos.forEach((logo, index) => {
        assetsText += `${index + 1}. ${logo.alt || 'Logo'}: ${logo.url}\n`
      })
      assetsText += '\n'
    }

    if (colors.length > 0) {
      assetsText += `COLORS (${colors.length}):\n`
      colors.forEach((color, index) => {
        assetsText += `${index + 1}. ${color.value}\n`
      })
      assetsText += '\n'
    }

    if (fonts.length > 0) {
      assetsText += `FONTS (${fonts.length}):\n`
      fonts.forEach((font, index) => {
        assetsText += `${index + 1}. ${font.name}${font.url ? `\n   URL: ${font.url}` : ''}\n`
        // Add CSS import suggestion for Google Fonts
        if (font.url && font.url.includes('fonts.googleapis.com') && font.name) {
          const fontFamily = font.name.replace(/\s+/g, '+')
          assetsText += `   CSS Import: @import url('https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap');\n`
        }
      })
      assetsText += '\n'
    }

    if (illustrations.length > 0) {
      assetsText += `ILLUSTRATIONS (${illustrations.length}):\n`
      illustrations.forEach((illustration, index) => {
        assetsText += `${index + 1}. ${illustration.alt || 'Illustration'}: ${illustration.url}\n`
      })
    }

    // Download the assets list as a text file
    const blob = new Blob([assetsText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${domain}-brand-assets.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Copy to clipboard failed:', error)
    }
  }

  const generateFontCSSImports = (fonts: any[]) => {
    const googleFonts = fonts.filter(font => 
      font.url && font.url.includes('fonts.googleapis.com') && font.name
    )
    
    if (googleFonts.length === 0) return ''
    
    // Generate CSS imports
    const imports = googleFonts.map(font => {
      const fontFamily = font.name.replace(/\s+/g, '+')
      return `@import url('https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap');`
    }).join('\n')
    
    const fontFamilies = googleFonts.map(font => `'${font.name}', sans-serif`).join(', ')
    
    return `/* CSS Font Imports */\n${imports}\n\n/* Font Family Usage */\nfont-family: ${fontFamilies};`
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
        <form onSubmit={handleSubmit} noValidate className="mb-8">
          <div className="max-w-2xl mx-auto">
            {/* Demo Mode Toggle - only show in development or when explicitly enabled */}
            {showDemoToggle && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-sm text-gray-600">Real Extraction</span>
                <button
                  type="button"
                  data-testid="demo-mode-toggle"
                  onClick={() => setIsDemoMode(!isDemoMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDemoMode ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDemoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">Demo Mode</span>
                <span className="text-xs text-gray-500">(avoids CORS)</span>
              </div>
            )}

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

        {/* Demo Site Suggestions - only show when demo mode is active */}
        {isDemoMode && (
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-4">
              Try these demo sites with realistic brand assets:
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {suggestedTestSites.map((site, index) => {
                const domain = new URL(site).hostname.replace('www.', '')
                return (
                  <button
                    key={index}
                    onClick={() => handleDemoSiteClick(site)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    {domain}
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-800">
                        Assets extracted successfully!
                      </h3>
                      <p className="text-green-700">
                        Found {extractionResult.assets!.logos.length} logos, {extractionResult.assets!.colors.length} colors, {extractionResult.assets!.fonts.length} fonts, and {extractionResult.assets!.illustrations.length} illustrations from {extractionResult.domain}
                      </p>
                    </div>
                    <button
                      onClick={downloadAllAssets}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Download All
                    </button>
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
                            <p className="text-xs text-gray-600 truncate mb-2" title={logo.url}>
                              {logo.alt || 'Logo'}
                            </p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  if (logo.url) {
                                    const extension = logo.url.split('.').pop() || 'png'
                                    downloadAsset(logo.url, `${logo.alt || 'logo'}-${index + 1}.${extension}`)
                                  }
                                }}
                                disabled={!logo.url}
                                className="flex-1 text-xs bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-2 py-1 rounded flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                              <a 
                                href={logo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-xs text-primary-500 hover:text-primary-700 border border-primary-500 hover:border-primary-700 px-2 py-1 rounded flex items-center justify-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {extractionResult.assets!.colors.length > 0 && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Palette className="w-5 h-5 text-primary-500" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            Colors ({extractionResult.assets!.colors.length})
                          </h4>
                        </div>
                        <button
                          onClick={() => {
                            const colorValues = extractionResult.assets!.colors.map(c => c.value).join('\n')
                            copyToClipboard(colorValues)
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy All
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {extractionResult.assets!.colors.slice(0, 12).map((color, index) => (
                          <div key={index} className="group cursor-pointer" onClick={() => {
                            if (color.value) {
                              copyToClipboard(color.value)
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
                            <div className="text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Copy className="w-3 h-3 text-gray-500 mx-auto" />
                            </div>
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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Type className="w-5 h-5 text-primary-500" />
                          <h4 className="text-lg font-semibold text-gray-900">
                            Fonts ({extractionResult.assets!.fonts.length})
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const fontLinks = extractionResult.assets!.fonts
                                .filter(font => font.url)
                                .map(font => `${font.name}: ${font.url}`)
                                .join('\n')
                              copyToClipboard(fontLinks)
                            }}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copy All Links
                          </button>
                          {extractionResult.assets!.fonts.some(font => 
                            font.url && font.url.includes('fonts.googleapis.com')
                          ) && (
                            <button
                              onClick={() => {
                                const cssImports = generateFontCSSImports(extractionResult.assets!.fonts)
                                copyToClipboard(cssImports)
                              }}
                              className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1 rounded flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy CSS Imports
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {extractionResult.assets!.fonts.slice(0, 8).map((font, index) => (
                          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 flex-1">{font.name}</p>
                              <div className="flex gap-2 ml-3">
                                {font.url && (
                                  <>
                                    <button
                                      onClick={() => copyToClipboard(font.url!)}
                                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
                                      title="Copy font URL"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy Link
                                    </button>
                                    <a 
                                      href={font.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary-500 hover:text-primary-700 border border-primary-500 hover:border-primary-700 px-2 py-1 rounded flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View Font
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                            {font.url && (
                              <p className="text-xs text-gray-500 mt-1 font-mono truncate" title={font.url}>
                                {font.url}
                              </p>
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
                            <p className="text-xs text-gray-600 truncate mb-2" title={illustration.url}>
                              {illustration.alt || 'Illustration'}
                            </p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  if (illustration.url) {
                                    const extension = illustration.url.split('.').pop() || 'png'
                                    downloadAsset(illustration.url, `${illustration.alt || 'illustration'}-${index + 1}.${extension}`)
                                  }
                                }}
                                disabled={!illustration.url}
                                className="flex-1 text-xs bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white px-2 py-1 rounded flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                              <a 
                                href={illustration.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-xs text-primary-500 hover:text-primary-700 border border-primary-500 hover:border-primary-700 px-2 py-1 rounded flex items-center justify-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open
                              </a>
                            </div>
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
