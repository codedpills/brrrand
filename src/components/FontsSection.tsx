import React from 'react'
import { Type, Copy, ExternalLink } from 'lucide-react'

interface Font {
  name?: string
  url?: string
}

interface FontsSectionProps {
  fonts: Font[]
  onCopyToClipboard: (text: string) => void
  onGenerateFontCSS: (fonts: Font[]) => string
}

export const FontsSection: React.FC<FontsSectionProps> = ({
  fonts,
  onCopyToClipboard,
  onGenerateFontCSS
}) => {
  if (fonts.length === 0) return null

  const hasGoogleFonts = fonts.some(font => 
    font.url && font.url.includes('fonts.googleapis.com')
  )

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-primary-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Fonts ({fonts.length})
          </h4>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const fontLinks = fonts
                .filter(font => font.url && font.name)
                .map(font => `${font.name}: ${font.url}`)
                .join('\n')
              onCopyToClipboard(fontLinks)
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Copy All Links
          </button>
          {hasGoogleFonts && (
            <button
              onClick={() => {
                const cssImports = onGenerateFontCSS(fonts)
                onCopyToClipboard(cssImports)
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
        {fonts.slice(0, 8).map((font, index) => (
          <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 flex-1">{font.name || 'Unknown Font'}</p>
              <div className="flex gap-2 ml-3">
                {font.url && (
                  <>
                    <button
                      onClick={() => onCopyToClipboard(font.url!)}
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
      {fonts.length > 8 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          +{fonts.length - 8} more fonts
        </p>
      )}
    </div>
  )
}
