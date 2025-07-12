import React, { useState } from 'react'
import { validateUrl } from '../utils/urlValidation'
import { extractAssets, type AssetExtractionResult } from '../utils/assetExtraction'
import { mockExtractAssets, suggestedTestSites } from '../utils/mockAssetExtraction'
import { downloadAsset, downloadAllAssets, copyToClipboard, generateFontCSSImports } from '../utils/downloadUtils'
import { useAnalytics } from './analytics'

import { HeroSection } from './HeroSection'
import { ExtractionForm } from './ExtractionForm'
import { DemoSiteSuggestions } from './DemoSiteSuggestions'
import { ExtractionResultHeader } from './ExtractionResultHeader'
import { LogosSection } from './LogosSection'
import { ColorsSection } from './ColorsSection'
import { FontsSection } from './FontsSection'
import { IllustrationsSection } from './IllustrationsSection'
import { FeaturesGrid } from './FeaturesGrid'
import { HowItWorksSection } from './HowItWorksSection'
import { LegalDisclaimer } from './LegalDisclaimer'

export const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<AssetExtractionResult | null>(null)
  
  const defaultDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === undefined
  const [isDemoMode, setIsDemoMode] = useState(defaultDemoMode)
  
  const showDemoToggle = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_TOGGLE === 'true'
  
  // Analytics hook for tracking
  const { trackExtraction, trackAssetDownload, trackError, trackAction } = useAnalytics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setValidationError(null)
    setExtractionResult(null)
    
    if (!url.trim()) {
      setValidationError('Please enter a URL')
      trackError('Empty URL submission');
      setIsValidating(false)
      return
    }
    
    const validation = validateUrl(url)
    
    if (!validation.isValid) {
      setValidationError(validation.error)
      trackError(`Invalid URL: ${url}`, 'URL_VALIDATION_ERROR');
      setIsValidating(false)
      return
    }
    
    setIsValidating(false)
    setIsExtracting(true)
    
    try {
      console.log('Extracting assets from:', validation.normalizedUrl)
      console.log('Domain:', validation.domain)
      console.log('Demo mode:', isDemoMode)
      
      // Track extraction attempt
      trackAction('extraction_attempt', validation.domain || undefined);
      
      // Use mock extraction in demo mode to avoid CORS
      const result = isDemoMode 
        ? await mockExtractAssets(validation.normalizedUrl!)
        : await extractAssets(validation.normalizedUrl!)
      
      setExtractionResult(result)
      
      if (!result.success) {
        setValidationError(result.error || 'Failed to extract assets')
        trackExtraction(validation.normalizedUrl || url, false);
      } else {
        // Count total assets extracted
        const totalAssets = 
          (result.assets?.logos?.length || 0) + 
          (result.assets?.colors?.length || 0) + 
          (result.assets?.fonts?.length || 0) + 
          (result.assets?.illustrations?.length || 0);
          
        // Track successful extraction
        trackExtraction(validation.normalizedUrl || url, true, totalAssets);
      }
    } catch (error) {
      console.error('Asset extraction failed:', error)
      if (error instanceof TypeError && error.message.includes('CORS')) {
        const errorMessage = 'CORS error: Enable Demo Mode to test asset extraction, or use a CORS proxy for real websites.';
        setValidationError(errorMessage);
        trackError(errorMessage, 'CORS_ERROR');
      } else {
        const errorMessage = 'An unexpected error occurred. Please try again.';
        setValidationError(errorMessage);
        trackError(errorMessage, 'EXTRACTION_ERROR');
      }
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDemoSiteClick = (siteUrl: string) => {
    setUrl(siteUrl)
    setValidationError(null)
    setExtractionResult(null)
    trackAction('demo_site_selected', siteUrl);
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (validationError) {
      setValidationError(null)
    }
  }

  const handleDemoToggle = () => {
    const newMode = !isDemoMode;
    setIsDemoMode(newMode);
    trackAction('demo_mode_toggled', newMode ? 'enabled' : 'disabled');
  }

  const handleDownloadAllAssets = () => {
    if (extractionResult) {
      downloadAllAssets(extractionResult);
      
      // Track the download of all assets
      const totalAssets = 
        (extractionResult.assets?.logos?.length || 0) + 
        (extractionResult.assets?.colors?.length || 0) + 
        (extractionResult.assets?.fonts?.length || 0) + 
        (extractionResult.assets?.illustrations?.length || 0);
      
      trackAssetDownload('all', totalAssets);
    }
  }

  return (
    <div data-testid="landing-page" className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <HeroSection 
          title="Extract Brrrand Assets"
          subtitle="Get client brand assets instantly - no more email chains"
          description="Free to use • No storage required • Instant results"
        />

        <ExtractionForm
          url={url}
          validationError={validationError}
          isValidating={isValidating}
          isExtracting={isExtracting}
          isDemoMode={isDemoMode}
          showDemoToggle={showDemoToggle}
          onSubmit={handleSubmit}
          onUrlChange={handleUrlChange}
          onDemoToggle={handleDemoToggle}
        />

        {isDemoMode && (
          <DemoSiteSuggestions
            suggestedSites={suggestedTestSites}
            onSiteClick={handleDemoSiteClick}
          />
        )}

        {extractionResult && (
          <div className="mb-12">
            <ExtractionResultHeader
              result={extractionResult}
              onDownloadAll={handleDownloadAllAssets}
            />

            {extractionResult.success && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <LogosSection
                    logos={extractionResult.assets!.logos}
                    onDownloadAsset={downloadAsset}
                  />

                  <ColorsSection
                    colors={extractionResult.assets!.colors}
                    onCopyToClipboard={copyToClipboard}
                  />

                  <FontsSection
                    fonts={extractionResult.assets!.fonts}
                    onCopyToClipboard={copyToClipboard}
                    onGenerateFontCSS={generateFontCSSImports}
                  />

                  <IllustrationsSection
                    illustrations={extractionResult.assets!.illustrations}
                    onDownloadAsset={downloadAsset}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <FeaturesGrid />

        <HowItWorksSection />

        <LegalDisclaimer />
      </div>
    </div>
  )
}
