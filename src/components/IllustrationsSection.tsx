import React from 'react'
import { Sparkles, Download, ExternalLink } from 'lucide-react'

interface Illustration {
  url?: string
  alt?: string
}

interface IllustrationsSectionProps {
  illustrations: Illustration[]
  onDownloadAsset: (url: string, filename: string) => void
}

export const IllustrationsSection: React.FC<IllustrationsSectionProps> = ({
  illustrations,
  onDownloadAsset
}) => {
  if (illustrations.length === 0) return null

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-primary-500" />
        <h4 className="text-lg font-semibold text-gray-900">
          Illustrations ({illustrations.length})
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {illustrations.slice(0, 6).map((illustration, index) => (
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
                    onDownloadAsset(illustration.url, `${illustration.alt || 'illustration'}-${index + 1}.${extension}`)
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
      {illustrations.length > 6 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          +{illustrations.length - 6} more illustrations
        </p>
      )}
    </div>
  )
}
