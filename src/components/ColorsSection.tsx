import React from 'react'
import { Palette, Copy } from 'lucide-react'

interface Color {
  value?: string
}

interface ColorsSectionProps {
  colors: Color[]
  onCopyToClipboard: (text: string) => void
}

export const ColorsSection: React.FC<ColorsSectionProps> = ({
  colors,
  onCopyToClipboard
}) => {
  if (colors.length === 0) return null

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-primary-500" />
          <h4 className="text-lg font-semibold text-gray-900">
            Colors ({colors.length})
          </h4>
        </div>
        <button
          onClick={() => {
            const colorValues = colors.map(c => c.value).join('\n')
            onCopyToClipboard(colorValues)
          }}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          Copy All
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {colors.slice(0, 12).map((color, index) => (
          <div key={index} className="group cursor-pointer" onClick={() => {
            if (color.value) {
              onCopyToClipboard(color.value)
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
      {colors.length > 12 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          +{colors.length - 12} more colors
        </p>
      )}
    </div>
  )
}
