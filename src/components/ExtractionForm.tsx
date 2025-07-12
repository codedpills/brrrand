import React from 'react'
import { Search, Download } from 'lucide-react'

interface ExtractionFormProps {
  url: string
  validationError: string | null
  isValidating: boolean
  isExtracting: boolean
  isDemoMode: boolean
  showDemoToggle: boolean
  onSubmit: (e: React.FormEvent) => void
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDemoToggle: () => void
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({
  url,
  validationError,
  isValidating,
  isExtracting,
  isDemoMode,
  showDemoToggle,
  onSubmit,
  onUrlChange,
  onDemoToggle
}) => {
  return (
    <form onSubmit={onSubmit} noValidate className="mb-8">
      <div className="max-w-2xl mx-auto">
        {/* Demo Mode Toggle - only show in development or when explicitly enabled */}
        {showDemoToggle && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm text-gray-600">Real Extraction</span>
            <button
              type="button"
              data-testid="demo-mode-toggle"
              onClick={onDemoToggle}
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
              onChange={onUrlChange}
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
  )
}
