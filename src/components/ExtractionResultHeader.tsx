import React from 'react'
import { Download, Archive } from 'lucide-react'
import type { AssetExtractionResult } from '../utils/assetExtraction'

interface ExtractionResultHeaderProps {
  result: AssetExtractionResult
  onDownloadAll: () => void
}

export const ExtractionResultHeader: React.FC<ExtractionResultHeaderProps> = ({
  result,
  onDownloadAll
}) => {
  if (!result.success) {
    return (
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
                {result.error}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
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
            Found {result.assets!.logos.length} logos, {result.assets!.colors.length} colors, {result.assets!.fonts.length} fonts, and {result.assets!.illustrations.length} illustrations from {result.domain}
          </p>
        </div>
        <button
          onClick={onDownloadAll}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Archive className="w-4 h-4" />
          Download All
        </button>
      </div>
    </div>
  )
}
