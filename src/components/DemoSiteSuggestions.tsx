import React from 'react'

interface DemoSiteSuggestionsProps {
  suggestedSites: string[]
  onSiteClick: (siteUrl: string) => void
}

export const DemoSiteSuggestions: React.FC<DemoSiteSuggestionsProps> = ({
  suggestedSites,
  onSiteClick
}) => {
  return (
    <div className="mb-8">
      <p className="text-center text-gray-600 mb-4">
        Try these demo sites with realistic brand assets:
      </p>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
        {suggestedSites.map((site, index) => {
          const domain = new URL(site).hostname.replace('www.', '')
          return (
            <button
              key={index}
              onClick={() => onSiteClick(site)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {domain}
            </button>
          )
        })}
      </div>
    </div>
  )
}
