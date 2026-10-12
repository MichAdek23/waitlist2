import { Header } from './components/Header';
import { SingleWaitlistForm } from './components/SingleWaitlistForm';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="dg-app">
      <Header />

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

            <SingleWaitlistForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
