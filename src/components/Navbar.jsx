import { Link, useLocation } from 'react-router-dom'

function LinkedinIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Tools', to: '/tools' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '18px',
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px',
          }}
        >
          KK<span style={{ opacity: 0.5 }}> /</span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navLinks.map(({ label, to }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                style={{
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: active ? '#e2e8f0' : '#94a3b8',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </Link>
            )
          })}

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/kriskorich"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#60a5fa'
              e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'
              e.currentTarget.style.background = 'rgba(96,165,250,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#94a3b8'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LinkedinIcon size={16} />
          </a>
        </div>
      </div>
    </nav>
  )
}
