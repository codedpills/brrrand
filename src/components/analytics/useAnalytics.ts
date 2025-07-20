/**
 * Analytics hooks for Brrrand
 * Provides easy access to analytics functions in components
 */
import { useCallback } from 'react';
import { analyticsService, EventCategory, type EventData } from '../../utils/analytics/analyticsService';

/**
 * Hook to use analytics tracking in components
 */
export function useAnalytics() {
  /**
   * Track a custom event
   */
  const trackEvent = useCallback((eventData: EventData) => {
    analyticsService.trackEvent(eventData);
  }, []);

  /**
   * Track asset extraction
   */
  const trackExtraction = useCallback((url: string, success: boolean, assetCount?: number) => {
    analyticsService.trackExtraction(url, success, assetCount);
  }, []);

  /**
   * Track asset download
   */
  const trackAssetDownload = useCallback((assetType: string, assetCount: number = 1) => {
    analyticsService.trackAssetDownload(assetType, assetCount);
  }, []);

  /**
   * Track error
   */
  const trackError = useCallback((errorMessage: string, errorCode?: string) => {
    analyticsService.trackError(errorMessage, errorCode);
  }, []);

  /**
   * Track user action
   */
  const trackAction = useCallback((action: string, label?: string, value?: number) => {
    analyticsService.trackEvent({
      action,
      category: EventCategory.USER_FLOW,
      label,
      value
    });
  }, []);

  /**
   * Track SEO-related events
   */
  const trackSEOEvent = useCallback((action: string, label?: string, value?: number) => {
    analyticsService.trackEvent({
      action,
      category: EventCategory.SEO,
      label,
      value
    });
  }, []);

  /**
   * Track search visibility metrics
   */
  const trackSearchVisibility = useCallback((source: string, query?: string) => {
    analyticsService.trackEvent({
      action: 'search_visit',
      category: EventCategory.SEO,
      label: source,
      value: query ? 1 : 0
    });
  }, []);

  /**
   * Track page performance for SEO
   */
  const trackPagePerformance = useCallback((metrics: { fcp?: number; lcp?: number; cls?: number; fid?: number }) => {
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        analyticsService.trackEvent({
          action: `core_web_vital_${metric}`,
          category: EventCategory.SEO,
          value: Math.round(value)
        });
      }
    });
  }, []);

  return {
    trackEvent,
    trackExtraction,
    trackAssetDownload,
    trackError,
    trackAction,
    trackSEOEvent,
    trackSearchVisibility,
    trackPagePerformance
  };
}
