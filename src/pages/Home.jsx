import { Link } from 'react-router-dom'
import { ArrowRight, Mic, FileText, BarChart2, Zap } from 'lucide-react'

const tools = [
  {
    icon: FileText,
    title: 'Proposal Generator',
    description:
      'AI-powered partnership and sales proposals crafted in seconds — personalized, on-brand, and ready to send.',
    href: '/proposal-generator',
    accent: '#3b82f6',
    tag: 'Sales',
  },
  {
    icon: Mic,
    title: 'Voice AI Demo Builder',
    description:
      'Spin up live voice AI demos for prospects using Deepgram speech-to-text and text-to-speech APIs.',
    href: '/tools',
    accent: '#8b5cf6',
    tag: 'Voice AI',
  },
  {
    icon: BarChart2,
    title: 'Deal Intelligence',
    description:
      'Analyze your pipeline data and surface AI-powered insights to accelerate partnership deals.',
    href: '/tools',
    accent: '#06b6d4',
    tag: 'Partnerships',
  },
  {
    icon: Zap,
    title: 'Outreach Accelerator',
    description:
      "Generate hyper-personalized cold outreach sequences tuned to each prospect's business context.",
    href: '/tools',
    accent: '#f59e0b',
    tag: 'Sales',
  },
]

function ToolCard({ icon: Icon, title, description, href, accent, tag }) {
  return (
    <Link
      to={href}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
          transition: 'all 0.2s ease',
          height: '100%',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.border = `1px solid ${accent}44`
          e.currentTarget.style.background = `${accent}0a`
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: `${accent}1a`,
            border: `1px solid ${accent}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: accent,
          }}
        >
          <Icon size={20} />
        </div>

        {/* Tag */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '8px',
            display: 'block',
          }}
        >
          {tag}
        </span>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#f1f5f9',
            letterSpacing: '-0.2px',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#64748b' }}>
          {description}
        </p>

        {/* Arrow */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: accent,
          }}
        >
          Explore <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Hero */}
      <section
        style={{
          paddingTop: '100px',
          paddingBottom: '80px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(139,92,246,0.3)',
            background: 'rgba(139,92,246,0.08)',
            fontSize: '12px',
            fontWeight: 500,
            color: '#a78bfa',
            marginBottom: '28px',
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#a78bfa',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          AI Portfolio · 2025
        </div>

        <h1
          style={{
            margin: '0 0 20px',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            color: '#f8fafc',
          }}
        >
          Kris Korich
        </h1>

        <p
          style={{
            margin: '0 auto 20px',
            maxWidth: '580px',
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            fontWeight: 400,
            lineHeight: 1.5,
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI-Powered Tools for Sales, Partnerships &amp; Voice AI
        </p>

        {/* Bio */}
        <p
          style={{
            margin: '0 auto 48px',
            maxWidth: '520px',
            fontSize: '16px',
            lineHeight: 1.7,
            color: '#64748b',
          }}
        >
          I build AI-powered tools that accelerate deals, delight partners, and push the
          boundaries of voice technology. Currently working at Deepgram on strategic
          partnerships and developer growth.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/tools"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '-0.1px',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            View All Tools <ArrowRight size={16} />
          </Link>
          <Link
            to="/proposal-generator"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '15px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = '#f1f5f9'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.color = '#cbd5e1'
            }}
          >
            Proposal Generator
          </Link>
        </div>
      </section>

      {/* Tools Grid */}
      <section style={{ paddingBottom: '100px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '-0.4px',
            }}
          >
            Featured Tools
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#475569' }}>
            Production-grade AI tools built for real GTM workflows.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {tools.map(tool => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>
    </main>
  )
}
