export default function Header() {
  return (
    <header className="header">
      <a href="/" aria-label="RelayPay home" className="header-logo-group" style={{ textDecoration: 'none' }}>
        <img src="/relaypay-logo.png" alt="RelayPay" style={{ height: '92px', width: '60px' }} />
      </a>
      <div className="header-trust">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Secure Support
      </div>
    </header>
  );
}
