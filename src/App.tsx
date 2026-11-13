import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SingleWaitlistForm } from './components/SingleWaitlistForm';
import { Footer } from './components/Footer';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';

type RouteView = 'home' | 'terms' | 'privacy' | 'delete-account';

function resolveRoute(pathname: string, hash: string): RouteView {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const cleanHash = hash.toLowerCase();

  if (
    cleanPath === '/terms' ||
    cleanPath === '/terms-and-conditions' ||
    cleanHash === '#terms'
  ) {
    return 'terms';
  }
  if (
    cleanPath === '/privacy' ||
    cleanPath === '/privacy-policy' ||
    cleanHash === '#privacy'
  ) {
    return 'privacy';
  }
  if (
    cleanPath === '/delete-account' ||
    cleanPath === '/request-account-deletion' ||
    cleanPath === '/data-deletion' ||
    cleanHash === '#delete-account'
  ) {
    return 'delete-account';
  }
  return 'home';
}

export function App() {
  const [route, setRoute] = useState<RouteView>(() =>
    resolveRoute(window.location.pathname, window.location.hash)
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(resolveRoute(window.location.pathname, window.location.hash));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (route === 'terms') {
      document.title = 'Terms and Conditions | Deliva Globe Ltd';
    } else if (route === 'privacy') {
      document.title = 'Privacy Policy | Deliva Globe Ltd';
    } else if (route === 'delete-account') {
      document.title = 'Account & Data Deletion | Deliva Globe Ltd';
    } else {
      document.title = 'Deliva | Priority Waitlist - Beyond Deliveries';
    }
  }, [route]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(resolveRoute(path, ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="dg-app">
      <Header onNavigate={navigateTo} />

      {route === 'terms' && <TermsPage onNavigate={navigateTo} />}

      {route === 'privacy' && <PrivacyPage onNavigate={navigateTo} />}

      {route === 'delete-account' && <DeleteAccountPage onNavigate={navigateTo} />}

      {route === 'home' && (
        <main className="dg-hero-section">
          <div className="dg-hero-bg-wrap" aria-hidden="true">
            <img src="/Hero_home.png" alt="" className="dg-hero-bg-img" />
            <div className="dg-hero-overlay" />
          </div>

          <div className="dg-hero-container">
            <div className="dg-hero-grid">
              <div className="dg-hero-text">
                <h1 className="dg-hero-heading">
                  Building the Trust Infrastructure for African Commerce
                </h1>
                <p className="dg-hero-subheading">
                  A technology-enabled logistics platform helping businesses move goods reliably,
                  fulfill orders seamlessly, and grow with confidence through transparent and
                  accountable delivery solutions.
                </p>
              </div>

              <SingleWaitlistForm onNavigate={navigateTo} />
            </div>
          </div>
        </main>
      )}

      <Footer
        onNavigate={navigateTo}
        initialModal={route === 'delete-account' ? 'deletion' : undefined}
      />
    </div>
  );
}

export default App;
