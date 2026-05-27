import { FileText, Sparkles, ArrowRight } from 'lucide-react'

const steps = [
  { num: '01', label: 'Enter Prospect Info', desc: 'Company name, industry, pain points, use case.' },
  { num: '02', label: 'AI Drafts Proposal', desc: 'Claude generates a tailored, on-brand proposal in seconds.' },
  { num: '03', label: 'Review & Export', desc: 'Edit inline, then export as PDF or copy to clipboard.' },
]

export default function ProposalGenerator() {
  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '72px 24px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '56px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.08)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#60a5fa',
            marginBottom: '20px',
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={12} /> AI-Powered
        </div>

        <h1
          style={{
            margin: '0 0 14px',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-1px',
          }}
        >
          Proposal Generator
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            lineHeight: 1.7,
            color: '#64748b',
            maxWidth: '480px',
          }}
        >
          Generate tailored partnership and sales proposals in seconds. Tell the AI about
          your prospect and it handles the rest — structure, tone, and personalization
          included.
        </p>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: '56px' }}>
        <h2
          style={{
            margin: '0 0 24px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#cbd5e1',
            letterSpacing: '-0.2px',
          }}
        >
          How it works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map((step, i) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                padding: '20px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#3b82f6',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '24px',
                }}
              >
                {step.num}
              </span>
              <div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '4px',
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder form shell */}
      <div
        style={{
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(59,130,246,0.2)',
          background: 'rgba(59,130,246,0.04)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#60a5fa',
          }}
        >
          <FileText size={26} />
        </div>

        <h3
          style={{
            margin: '0 0 10px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#f1f5f9',
            letterSpacing: '-0.3px',
          }}
        >
          Generator Coming Soon
        </h3>
        <p
          style={{
            margin: '0 0 28px',
            fontSize: '15px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '360px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          The AI proposal engine is in active development. Enter your email to get early
          access when it launches.
        </p>

        <form
          onSubmit={e => e.preventDefault()}
          style={{
            display: 'flex',
            gap: '10px',
            maxWidth: '400px',
            margin: '0 auto',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#f1f5f9',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Notify Me <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </main>
  )
}
