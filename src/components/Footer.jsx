import { Link } from 'react-router-dom'
import { ShieldCheck, Lock } from 'lucide-react'
import BrandLogo from './BrandLogo'

export default function Footer({ compact = false }) {
  const currentYear = new Date().getFullYear()

  if (compact) {
    return (
      <footer
        style={{
          padding: '16px 0',
          borderTop: '1px solid var(--border-soft)',
          marginTop: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 12,
          color: 'var(--text-3)',
        }}
      >
        <div>
          &copy; {currentYear} APPSC AI. All rights reserved.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            to="/privacy-policy"
            style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Privacy Policy
          </Link>
          <span style={{ opacity: 0.4 }}>•</span>
          <Link
            to="/terms-and-conditions"
            style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Terms &amp; Conditions
          </Link>
          <span style={{ opacity: 0.4 }}>•</span>
          <Link
            to="/refund-policy"
            style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Refund Policy
          </Link>
        </div>
      </footer>
    )
  }

  return (
    <footer
      style={{
        marginTop: 56,
        paddingTop: 32,
        paddingBottom: 28,
        borderTop: '1px solid var(--border-soft)',
        color: 'var(--text-3)',
        fontSize: 12.5,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 10 }}>
            <BrandLogo size={28} showText={true} textSize={16} />
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--text-3)' }}>
            AI-powered preparation platform for APPSC Group 1 &amp; Group 2 civil services examinations. Precision MCQs, structured study notes, and Bloom-aligned Mains answer evaluation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 10 }}>
              Legal &amp; Compliance
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <li>
                <Link
                  to="/privacy-policy"
                  style={{ color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  style={{ color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  style={{ color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--indigo)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 10 }}>
              Security &amp; Trust
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                <Lock size={14} style={{ color: 'var(--indigo)' }} />
                <span>PhonePe / RBI PG Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          paddingTop: 18,
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 11.5,
        }}
      >
        <div>
          &copy; {currentYear} APPSC AI. All rights reserved. Disclaimer: APPSC AI is an independent educational platform and is not affiliated with APPSC or any government body.
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/privacy-policy" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms-and-conditions" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/refund-policy" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Refunds</Link>
        </div>
      </div>
    </footer>
  )
}
