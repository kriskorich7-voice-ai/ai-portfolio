import { Link } from 'react-router-dom'
import { Mic, FileText, BarChart2, Zap, ExternalLink } from 'lucide-react'

const tools = [
  {
    icon: FileText,
    title: 'Proposal Generator',
    description:
      'Generate tailored partnership and sales proposals in seconds using AI. Input context about your prospect and get a polished, on-brand document ready to send.',
    href: '/proposal-generator',
    accent: '#3b82f6',
    tag: 'Sales',
    status: 'Live',
  },
  {
    icon: Mic,
    title: 'Voice AI Demo Builder',
    description:
      'Instantly create interactive voice AI demos powered by Deepgram STT and TTS. Perfect for showing prospects the power of real-time voice in their stack.',
    href: '#',
    accent: '#8b5cf6',
    tag: 'Voice AI',
    status: 'Coming Soon',
  },
  {
    icon: BarChart2,
    title: 'Deal Intelligence',
    description:
      'AI-powered analysis of your partnership pipeline. Surface hidden patterns, flag at-risk deals, and get action recommendations before the next call.',
    href: '#',
    accent: '#06b6d4',
    tag: 'Partnerships',
    status: 'Coming Soon',
  },
  {
    icon: Zap,
    title: 'Outreach Accelerator',
    description:
      'Multi-step AI outreach sequences personalized to each target company. Uses public signals (news, funding, job posts) to craft highly relevant messages.',
    href: '#',
    accent: '#f59e0b',
    tag: 'Sales',
    status: 'Coming Soon',
  },
]

function ToolRow({ icon: Icon, title, description, href, accent, tag, status }) {
  const isLive = status === 'Live'
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        padding: '24px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        alignItems: 'flex-start',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          minWidth: '48px',
          borderRadius: '12px',
          background: `${accent}1a`,
          border: `1px solid ${accent}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
        }}
      >
        <Icon size={22} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '6px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 600,
              color: '#f1f5f9',
              letterSpacing: '-0.2px',
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: accent,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${accent}15`,
            }}
          >
            {tag}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: isLive ? '#34d399' : '#64748b',
              padding: '2px 8px',
              borderRadius: '4px',
              background: isLive ? 'rgba(52,211,153,0.12)' : 'rgba(100,116,139,0.12)',
            }}
          >
            {status}
          </span>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '14px', lineHeight: 1.65, color: '#64748b' }}>
          {description}
        </p>
        {isLive ? (
          <Link
            to={href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: accent,
              textDecoration: 'none',
            }}
          >
            Open Tool <ExternalLink size={13} />
          </Link>
        ) : (
          <span style={{ fontSize: '13px', color: '#374151' }}>In development</span>
        )}
      </div>
    </div>
  )
}

export default function Tools() {
  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '56px' }}>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8b5cf6',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          AI Tool Gallery
        </span>
        <h1
          style={{
            margin: '0 0 14px',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-1px',
          }}
        >
          Tools I've Built
        </h1>
        <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6, color: '#64748b', maxWidth: '480px' }}>
          A collection of AI-powered tools purpose-built for GTM, partnerships, and voice
          technology workflows.
        </p>
      </div>

      {/* Tool List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tools.map(tool => (
          <ToolRow key={tool.title} {...tool} />
        ))}
      </div>
    </main>
  )
}
