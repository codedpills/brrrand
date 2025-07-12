/**
 * Consent Banner Component for Brrrand
 * Allows users to manage their consent for analytics and marketing
 */
import { useState, useEffect } from 'react';
import { analyticsService, ConsentState, type AnalyticsConsent } from '../../utils/analytics/analyticsService';

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent>(analyticsService.getConsent());

  // Check if consent is needed on component mount
  useEffect(() => {
    const currentConsent = analyticsService.getConsent();
    if (
      currentConsent.analytics === ConsentState.UNKNOWN ||
      currentConsent.marketing === ConsentState.UNKNOWN
    ) {
      setIsVisible(true);
    }
  }, []);

  // Accept all tracking
  const acceptAll = () => {
    const newConsent = {
      analytics: ConsentState.GRANTED,
      marketing: ConsentState.GRANTED
    };
    
    analyticsService.updateConsent(newConsent);
    setConsent({ ...consent, ...newConsent });
    setIsVisible(false);
  };

  // Accept only necessary cookies
  const acceptNecessary = () => {
    const newConsent = {
      analytics: ConsentState.DENIED,
      marketing: ConsentState.DENIED
    };
    
    analyticsService.updateConsent(newConsent);
    setConsent({ ...consent, ...newConsent });
    setIsVisible(false);
  };

  // Toggle consent settings panel
  const openSettings = () => {
    // This would open a more detailed settings panel
    // For now we just show a console message
    console.log('Open consent settings - implement detailed settings panel');
  };

  // No need to render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 z-50 border-t-2 border-pink-500">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Cookie Consent</h3>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your experience and analyze our website traffic. 
              By clicking "Accept All", you consent to our use of cookies for analytics and personalized content.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openSettings}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Customize
            </button>
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Necessary Only
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
