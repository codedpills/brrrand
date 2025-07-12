/**
 * Analytics Provider Component for Brrrand
 * Sets up analytics tracking and provides context for analytics
 */
import { useEffect } from 'react';
import { analyticsService, ConsentState } from '../../utils/analytics/analyticsService';
import { initWebVitals } from '../../utils/analytics/webVitals';
import { ConsentBanner } from './ConsentBanner';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize analytics service
    analyticsService.initialize();
    
    // Track initial page view if consent has been granted
    const consent = analyticsService.getConsent();
    if (consent.analytics === ConsentState.GRANTED) {
      analyticsService.trackPageView(window.location.pathname);
      
      // Initialize Web Vitals monitoring
      initWebVitals();
    }
    
    // Set up navigation tracking via History API
    const handleRouteChange = () => {
      const consent = analyticsService.getConsent();
      if (consent.analytics === ConsentState.GRANTED) {
        analyticsService.trackPageView(window.location.pathname);
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
