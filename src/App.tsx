import { LandingPage } from './components/LandingPage';
import { AnalyticsProvider } from './components/analytics';

function App() {
  return (
    <AnalyticsProvider>
      <LandingPage />
    </AnalyticsProvider>
  );
}

export default App;
