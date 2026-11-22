import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SingleWaitlistForm } from './components/SingleWaitlistForm';
import { Footer } from './components/Footer';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { DriversPortalPage } from './pages/DriversPortalPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { ContactPage } from './pages/ContactPage';
import { SupportLoginPage } from './pages/SupportLoginPage';
import { AgentLoginPage } from './pages/AgentLoginPage';
import { AgentDashboardPage } from './pages/AgentDashboardPage';

type RouteView =
  | 'home'
  | 'terms'
  | 'privacy'
  | 'delete-account'
  | 'driversportal'
  | 'help'
  | 'contact'
  | 'support-login'
  | 'agent-login'
  | 'agent-dashboard';

function resolveRoute(pathname: string, hash: string): RouteView {
  const cleanPath = (pathname.split('?')[0] || '/').toLowerCase().replace(/\/+$/, '') || '/';
  const cleanHash = hash.toLowerCase();

  if (
    cleanPath === '/help' ||
    cleanPath === '/support' ||
    cleanPath === '/help-support' ||
    cleanPath === '/faq' ||
    cleanHash === '#help' ||
    cleanHash === '#support'
  ) {
    return 'help';
  }

  if (
    cleanPath === '/contact' ||
    cleanPath === '/contact-us' ||
    cleanHash === '#contact'
  ) {
    return 'contact';
  }

  if (
    cleanPath === '/support-login' ||
    cleanHash === '#support-login'
  ) {
    return 'support-login';
  }

  if (
    cleanPath === '/agent-login' ||
    cleanHash === '#agent-login'
  ) {
    return 'agent-login';
  }

  if (
    cleanPath === '/dashboard' ||
    cleanPath.startsWith('/dashboard/') ||
    cleanPath === '/agent-dashboard' ||
    cleanPath.startsWith('/agent-dashboard/') ||
    cleanPath === '/support-dashboard' ||
    cleanPath.startsWith('/support-dashboard/') ||
    cleanHash === '#dashboard'
  ) {
    return 'agent-dashboard';
  }

  if (
    cleanPath === '/driversportal' ||
    cleanPath === '/drivers-portal' ||
    cleanPath === '/driver-portal' ||
    cleanHash === '#driversportal'
  ) {
    return 'driversportal';
  }

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
    } else if (route === 'driversportal') {
      document.title = 'Drivers Portal | Deliva Globe Ltd';
    } else if (route === 'help') {
      document.title = 'Help & Support Center | Deliva Globe Ltd';
    } else if (route === 'contact') {
      document.title = 'Contact Operations | Deliva Globe Ltd';
    } else if (route === 'support-login') {
      document.title = 'Support Center Sign In | Deliva Globe Ltd';
    } else if (route === 'agent-login') {
      document.title = 'Support Agent Portal | Deliva Globe Ltd';
    } else if (route === 'agent-dashboard') {
      document.title = 'Agent Operations Dashboard | Deliva Globe Ltd';
    } else {
      document.title = 'Deliva | Priority Waitlist - Beyond Deliveries';
    }
  }, [route]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    const nextRoute = resolveRoute(path, '');
    setRoute(nextRoute);
    if (nextRoute !== 'agent-dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  if (route === 'agent-dashboard') {
    return <AgentDashboardPage onNavigate={navigateTo} />;
  }

  return (
    <div className="dg-app">
      <Header
        onNavigate={navigateTo}
        hideTimer={
          route === 'driversportal' ||
          route === 'help' ||
          route === 'contact' ||
          route === 'support-login' ||
          route === 'agent-login'
        }
        isPortal={route === 'driversportal'}
      />

      {route === 'terms' && <TermsPage onNavigate={navigateTo} />}

      {route === 'privacy' && <PrivacyPage onNavigate={navigateTo} />}

      {route === 'delete-account' && <DeleteAccountPage onNavigate={navigateTo} />}

      {route === 'driversportal' && <DriversPortalPage onNavigate={navigateTo} />}

      {route === 'help' && <HelpSupportPage onNavigate={navigateTo} />}

      {route === 'contact' && <ContactPage onNavigate={navigateTo} />}

      {route === 'support-login' && <SupportLoginPage onNavigate={navigateTo} />}

      {route === 'agent-login' && <AgentLoginPage onNavigate={navigateTo} />}

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
        hideDownloadCta={
          route === 'driversportal' ||
          route === 'help' ||
          route === 'contact' ||
          route === 'support-login' ||
          route === 'agent-login'
        }
      />
    </div>
  );
}

export default App;
