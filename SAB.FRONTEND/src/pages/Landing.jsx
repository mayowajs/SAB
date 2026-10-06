import { Link } from 'react-router-dom';
import '../styles/landing.css';

const features = [
  { icon: '💸', title: 'Instant Transfers', desc: 'Send money to any SAB account or other Nigerian banks instantly with zero delays.' },
  { icon: '🔒', title: 'Bank-Grade Security', desc: 'Your funds are protected with JWT authentication and encrypted transactions.' },
  { icon: '💳', title: 'Virtual Debit Card', desc: 'Get a virtual debit card linked to your SAB account for online payments.' },
  { icon: '📊', title: 'Transaction History', desc: 'Track every naira with detailed transaction history, filters and receipts.' },
  { icon: '🏦', title: 'Inter-Bank Transfers', desc: 'Send money to GTBank, Access, Zenith, UBA and all major Nigerian banks.' },
  { icon: '⚡', title: '24/7 Banking', desc: 'Bank anytime, anywhere. No queues, no closing hours, just seamless banking.' },
];

const steps = [
  { n: '1', title: 'Create Account', desc: 'Sign up in seconds with your name and email. Get an account number instantly.' },
  { n: '2', title: 'Fund Your Account', desc: 'Receive money from other SAB users or inter-bank transfers.' },
  { n: '3', title: 'Send Money', desc: 'Transfer to any account number. Verify recipient before sending.' },
  { n: '4', title: 'Track Everything', desc: 'View receipts, transaction history and manage your card.' },
];

export const Landing = () => {
  return (
    <div>
      {/* Navbar */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-logo">
          <div className="landing-nav-logo-icon">SAB</div>
          Silver Age Bank <span>➤➤</span>
        </Link>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#footer">Contact</a>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-outline">Sign In</Link>
          <Link to="/register" className="btn-solid">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span>●</span> Trusted by thousands of Nigerians
            </div>
            <h1 className="hero-title">
              Banking that <em>works</em> for you
            </h1>
            <p className="hero-subtitle">
              SAB — Silver Age Bank gives you instant transfers, inter-bank payments,
              virtual cards and full transaction history. All in one place.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-solid">Open Free Account</Link>
              <Link to="/login" className="btn-outline">Sign In</Link>
            </div>
            <div className="hero-stats">
              <div>
                <p className="hero-stat-value">₦0 fees</p>
                <p className="hero-stat-label">On transfers</p>
              </div>
              <div>
                <p className="hero-stat-value">Instant</p>
                <p className="hero-stat-label">Settlements</p>
              </div>
              <div>
                <p className="hero-stat-value">24/7</p>
                <p className="hero-stat-label">Always online</p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="hero-visual">
            <div className="hero-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80"
                alt="Happy SAB customer"
                className="hero-img"
              />
              <div className="hero-img-badge hero-img-badge--tl">
                <span className="hib-icon">✅</span>
                <div>
                  <p className="hib-val">Verified & Secure</p>
                  <p className="hib-sub">Bank-grade encryption</p>
                </div>
              </div>
              <div className="hero-img-badge hero-img-badge--br">
                <span className="hib-icon">⚡</span>
                <div>
                  <p className="hib-val">₦2.4B+ Transferred</p>
                  <p className="hib-sub">This month alone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item"><span className="trust-num">50,000+</span><span className="trust-label">Active Users</span></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-num">₦10B+</span><span className="trust-label">Total Transfers</span></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-num">99.9%</span><span className="trust-label">Uptime</span></div>
          <div className="trust-divider" />
          <div className="trust-item"><span className="trust-num">4.9★</span><span className="trust-label">User Rating</span></div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need to bank smarter</h2>
          <p className="section-subtitle">
            Built for Nigerians who want fast, secure and modern banking without the stress.
          </p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SAB — image split */}
      <section className="why-sab">
        <div className="why-sab-inner">
          <div className="why-sab-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80"
              alt="SAB mobile banking"
              className="why-sab-img"
            />
            <div className="why-sab-img-overlay">
              <div className="why-overlay-card">
                <p className="why-overlay-label">Transfer sent</p>
                <p className="why-overlay-amount">₦45,000</p>
                <p className="why-overlay-sub">To Amaka Obi · Just now</p>
              </div>
            </div>
          </div>
          <div className="why-sab-text">
            <p className="section-label">Why SAB</p>
            <h2 className="section-title">Built for the way Nigerians actually bank</h2>
            <p className="section-subtitle">No hidden charges. No long queues. No stress. Just open your phone and move money.</p>
            <ul className="why-list">
              <li><span className="why-check">✓</span> Send to any Nigerian bank account instantly</li>
              <li><span className="why-check">✓</span> Zero transfer fees between SAB accounts</li>
              <li><span className="why-check">✓</span> Virtual debit card for online shopping</li>
              <li><span className="why-check">✓</span> Real-time transaction alerts & receipts</li>
              <li><span className="why-check">✓</span> 24/7 access — no downtime, no excuses</li>
            </ul>
            <Link to="/register" className="btn-solid" style={{ display: 'inline-block', marginTop: 32 }}>Open Account Free →</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how">
        <div className="how-it-works">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Up and running in minutes</h2>
          <p className="section-subtitle">
            No paperwork, no branch visits. Just sign up and start banking.
          </p>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} className="step">
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">Start banking with SAB today</h2>
        <p className="cta-subtitle">Join thousands of Nigerians already using Silver Age Bank</p>
        <Link to="/register" className="btn-solid">Create Free Account →</Link>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div className="landing-nav-logo-icon">SAB</div>
              <span style={{ fontWeight: 800, fontSize: 18 }}>Silver Age Bank</span>
            </div>
            <p>Modern banking for every Nigerian. Fast, secure and always available.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <Link to="/register">Get Started</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Silver Age Bank. All rights reserved.</p>
          <p>Built with ❤️ for Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
