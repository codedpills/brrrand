/**
 * Web Vitals monitoring for Brrrand
 * Tracks Core Web Vitals and reports them to Google Analytics
 */
import { onCLS, onFID, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { analyticsService, EventCategory } from './analyticsService';

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  const reportWebVital = (metric: Metric): void => {
    const { name, value, id, delta } = metric;
    
    // Report to analytics
    analyticsService.trackEvent({
      action: 'web_vitals',
      category: EventCategory.PERFORMANCE,
      label: name,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      nonInteraction: true,
      metric_id: id,
      metric_value: value,
      metric_delta: delta
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vitals: ${name}`, metric);
    }
  };

  // Measure and report each vital
  onCLS(reportWebVital);
  onFID(reportWebVital);
  onLCP(reportWebVital);
  onFCP(reportWebVital);
  onTTFB(reportWebVital);
}
