import React from 'react'

export const HowItWorksSection: React.FC = () => {
  return (
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
  )
}
