import React from 'react'
import { Image, Download, ExternalLink } from 'lucide-react'

interface Logo {
  url?: string
  alt?: string
}

interface LogosSectionProps {
  logos: Logo[]
  onDownloadAsset: (url: string, filename: string) => void
}

export const LogosSection: React.FC<LogosSectionProps> = ({
  logos,
  onDownloadAsset
}) => {
  if (logos.length === 0) return null

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Image className="w-5 h-5 text-primary-500" />
        <h4 className="text-lg font-semibold text-gray-900">
          Logos ({logos.length})
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {logos.map((logo, index) => (
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
                    onDownloadAsset(logo.url, `${logo.alt || 'logo'}-${index + 1}.${extension}`)
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
  )
}
