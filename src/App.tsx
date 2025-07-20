import { LandingPage } from './components/LandingPage';
import { AnalyticsProvider } from './components/analytics';
import { SEOHead, trackPagePerformance, generateWebApplicationSchema } from './components/SEO';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Track page performance for SEO optimization
    trackPagePerformance();
  }, []);

  return (
    <AnalyticsProvider>
      <SEOHead structuredData={generateWebApplicationSchema()} />
      <LandingPage />
    </AnalyticsProvider>
  );
}

export default App;
