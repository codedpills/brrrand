/**
 * Analytics Service for Brrrand
 * Implements Google Analytics 4 (GA4) and Google Tag Manager (GTM)
 * with privacy-compliant data collection and user consent
 */

// Google Analytics Measurement ID and GTM Container ID from environment variables
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const GTM_CONTAINER_ID = import.meta.env.VITE_GTM_CONTAINER_ID || '';

/**
 * Analytics consent states
 */
export const ConsentState = {
  UNKNOWN: 'unknown',
  GRANTED: 'granted',
  DENIED: 'denied'
} as const;

export type ConsentStateType = typeof ConsentState[keyof typeof ConsentState];

/**
 * User's analytics preferences
 */
export interface AnalyticsConsent {
  necessary: boolean; // Always true, can't be opted out
  analytics: ConsentStateType;
  marketing: ConsentStateType;
}

// Default consent state - no tracking until user provides consent
const DEFAULT_CONSENT: AnalyticsConsent = {
  necessary: true,
  analytics: ConsentState.UNKNOWN,
  marketing: ConsentState.UNKNOWN
};

/**
 * Event categories for analytics tracking
 */
export const EventCategory = {
  EXTRACTION: 'extraction',
  ASSETS: 'assets',
  DOWNLOAD: 'download',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  USER_FLOW: 'user_flow',
  SEO: 'seo'
} as const;

export type EventCategoryType = typeof EventCategory[keyof typeof EventCategory];

/**
 * Interface for event data
 */
export interface EventData {
  action: string;
  category: EventCategoryType;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  [key: string]: any;
}

/**
 * Analytics Service class
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private consent: AnalyticsConsent = DEFAULT_CONSENT;
  private initialized = false;
  private gtmInitialized = false;
  private gaInitialized = false;

  /**
   * Get singleton instance
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.loadSavedConsent();
  }

  /**
   * Load saved consent state from localStorage
   */
  private loadSavedConsent(): void {
    try {
      const savedConsent = localStorage.getItem('brrrand_analytics_consent');
      if (savedConsent) {
        this.consent = JSON.parse(savedConsent);
      }
    } catch (error) {
      console.error('Failed to load analytics consent:', error);
    }
  }

  /**
   * Save consent state to localStorage
   */
  private saveConsent(): void {
    try {
      localStorage.setItem('brrrand_analytics_consent', JSON.stringify(this.consent));
    } catch (error) {
      console.error('Failed to save analytics consent:', error);
    }
  }

  /**
   * Initialize analytics based on current consent
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const isProduction = import.meta.env.PROD;
    
    // Skip initialization in development unless explicitly enabled
    if (!isProduction && !import.meta.env.VITE_ENABLE_ANALYTICS) {
      console.log('Analytics disabled in development. Set VITE_ENABLE_ANALYTICS=true to enable.');
      return;
    }

    // Only initialize tracking if consent has been granted
    if (this.consent.analytics === ConsentState.GRANTED) {
      this.initializeGTM();
      this.initializeGA4();
    }
  }

  /**
   * Initialize Google Tag Manager
   */
  private initializeGTM(): void {
    if (this.gtmInitialized) {
      return;
    }
    
    if (!GTM_CONTAINER_ID) {
      console.warn('GTM Container ID not provided. Set VITE_GTM_CONTAINER_ID environment variable.');
      return;
    }

    try {
      // Create and add GTM script to document
      const script = document.createElement('script');
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');
      `;
      document.head.appendChild(script);

      // Add GTM noscript fallback for browsers with JavaScript disabled
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.appendChild(noscript);

      this.gtmInitialized = true;
      
      // Add environment info to dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'environment': import.meta.env.MODE,
        'buildDate': new Date().toISOString()
      });
      
      console.log('Google Tag Manager initialized');
    } catch (error) {
      console.error('Failed to initialize GTM:', error);
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private initializeGA4(): void {
    if (this.gaInitialized) {
      return;
    }
    
    if (!GA_MEASUREMENT_ID) {
      console.warn('GA Measurement ID not provided. Set VITE_GA_MEASUREMENT_ID environment variable.');
      return;
    }

    try {
      // Add GA4 script to document
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      // Configure GA4
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: true,
        anonymize_ip: true,
        cookie_domain: window.location.hostname,
        cookie_flags: 'SameSite=None;Secure',
        custom_map: {
          dimension1: 'client_id',
          dimension2: 'environment'
        }
      });
      
      // Set additional parameters
      window.gtag('set', {
        'user_properties': {
          'environment': import.meta.env.MODE,
          'app_version': import.meta.env.VITE_APP_VERSION || '1.0.0',
          'app_name': 'Brrrand'
        }
      });

      this.gaInitialized = true;
      console.log('Google Analytics 4 initialized');
    } catch (error) {
      console.error('Failed to initialize GA4:', error);
    }
  }

  /**
   * Update consent settings
   */
  public updateConsent(consent: Partial<AnalyticsConsent>): void {
    this.consent = { ...this.consent, ...consent };
    this.saveConsent();
    
    // Apply changes based on updated consent
    if (this.consent.analytics === ConsentState.GRANTED && !this.gaInitialized) {
      this.initializeGTM();
      this.initializeGA4();
    }
  }

  /**
   * Get current consent state
   */
  public getConsent(): AnalyticsConsent {
    return { ...this.consent };
  }

  /**
   * Track a custom event
   */
  public trackEvent(eventData: EventData): void {
    if (!this.initialized || this.consent.analytics !== ConsentState.GRANTED) {
      return;
    }

    try {
      const eventParams = {
        event_category: eventData.category,
        event_label: eventData.label,
        value: eventData.value,
        non_interaction: eventData.nonInteraction || false,
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE,
        ...eventData
      };

      // Track with GA4
      if (window.gtag) {
        window.gtag('event', eventData.action, eventParams);
      }
      
      // Also push to dataLayer for GTM
      if (window.dataLayer) {
        window.dataLayer.push({
          event: eventData.action,
          ...eventParams
        });
      }
      
      // Log events in development
      if (import.meta.env.DEV) {
        console.debug(`Analytics Event: ${eventData.action}`, eventParams);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page view
   */
  public trackPageView(page: string): void {
    if (!this.initialized || this.consent.analytics !== ConsentState.GRANTED) {
      return;
    }

    try {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: page || window.location.pathname
        });
      }

      // Also push to dataLayer for GTM
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'page_view',
          page_title: document.title,
          page_location: window.location.href,
          page_path: page || window.location.pathname
        });
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track asset extraction
   */
  public trackExtraction(url: string, success: boolean, assetCount?: number): void {
    this.trackEvent({
      action: success ? 'extraction_success' : 'extraction_failure',
      category: EventCategory.EXTRACTION,
      label: url,
      value: assetCount
    });
  }

  /**
   * Track asset download
   */
  public trackAssetDownload(assetType: string, assetCount: number = 1): void {
    this.trackEvent({
      action: 'asset_download',
      category: EventCategory.DOWNLOAD,
      label: assetType,
      value: assetCount
    });
  }

  /**
   * Track error
   */
  public trackError(errorMessage: string, errorCode?: string): void {
    this.trackEvent({
      action: 'error',
      category: EventCategory.ERROR,
      label: errorMessage,
      errorCode
    });
  }
}

// Add types for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
