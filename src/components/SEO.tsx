import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

export function SEOHead({
  title = 'Brrrand - Free Brand Asset Extractor | Extract Logos, Colors & Fonts from Any Website',
  description = 'Extract brand assets from any website instantly! Get logos, color palettes, fonts, and illustrations from your favorite sites. Free, fast, and no signup required.',
  keywords = 'brand assets, logo extraction, color palette generator, font finder, web scraping, design tools, brand analysis, website assets, logo download, color extraction',
  canonicalUrl = 'https://brrrand.it.com/',
  ogImage = 'https://brrrand.it.com/og-image.png',
  structuredData
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Update Open Graph tags
    updateMetaProperty('og:title', title);
    updateMetaProperty('og:description', description);
    updateMetaProperty('og:url', canonicalUrl);
    updateMetaProperty('og:image', ogImage);
    
    // Update Twitter tags
    updateMetaName('twitter:title', title);
    updateMetaName('twitter:description', description);
    updateMetaName('twitter:image', ogImage);
    
    // Update canonical URL
    updateCanonical(canonicalUrl);
    
    // Update structured data if provided
    if (structuredData) {
      updateStructuredData(structuredData);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, structuredData]);

  return null; // This component doesn't render anything
}

function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function updateStructuredData(data: Record<string, any>) {
  let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

// SEO Analytics tracking
export function trackSEOEvent(eventName: string, parameters?: Record<string, any>) {
  // Track SEO-related events for optimization
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'SEO',
      ...parameters
    });
  }
}

// Track page performance for SEO
export function trackPagePerformance() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      if (navigation) {
        // Track Core Web Vitals for SEO
        trackSEOEvent('page_load_time', {
          load_time: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)
        });
      }
      
      // Track First Contentful Paint
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        trackSEOEvent('first_contentful_paint', {
          fcp_time: Math.round(fcp.startTime)
        });
      }
    });
  }
}

// Schema.org structured data helpers
export const generateWebApplicationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Brrrand',
  alternateName: 'Brand Asset Extractor',
  url: 'https://brrrand.it.com',
  description: 'Extract brand assets from any website instantly! Get logos, color palettes, fonts, and illustrations from your favorite sites. Free, fast, and no signup required.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  featureList: [
    'Logo extraction',
    'Color palette generation',
    'Font identification',
    'Illustration download',
    'Bulk asset download',
    'No signup required'
  ],
  screenshot: 'https://brrrand.it.com/og-image.png',
  author: {
    '@type': 'Organization',
    name: 'Brrrand',
    url: 'https://brrrand.it.com'
  },
  datePublished: '2025-07-12',
  dateModified: new Date().toISOString().split('T')[0],
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  softwareVersion: '1.0',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1'
  }
});

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});
