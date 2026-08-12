import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  h1: ({ children }) => (
    <h1
      style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '1.6rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, var(--color-accent), #7B5EF8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: '10px',
        marginBottom: '18px',
        marginTop: '0',
      }}
    >
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2
      style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, var(--color-accent), #7B5EF8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '8px',
        marginBottom: '14px',
        marginTop: '28px',
      }}
    >
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3
      style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        borderLeft: '3px solid var(--color-accent)',
        paddingLeft: '12px',
        marginBottom: '10px',
        marginTop: '20px',
      }}
    >
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4
      style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: 'var(--color-muted)',
        marginBottom: '8px',
        marginTop: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </h4>
  ),

  p: ({ children }) => (
    <p
      style={{
        color: 'var(--color-text)',
        fontSize: '0.95rem',
        lineHeight: '1.85',
        marginBottom: '14px',
      }}
    >
      {children}
    </p>
  ),

  ul: ({ children }) => (
    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '14px' }}>
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol style={{ paddingLeft: '20px', marginBottom: '14px', color: 'var(--color-text)' }}>
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li
      style={{
        position: 'relative',
        paddingLeft: '20px',
        paddingTop: '3px',
        paddingBottom: '3px',
        color: 'var(--color-text)',
        fontSize: '0.95rem',
        lineHeight: '1.7',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '4px',
          top: '11px',
          width: '6px',
          height: '6px',
          background: 'var(--color-accent)',
          borderRadius: '50%',
          flexShrink: 0,
        }}
      />
      {children}
    </li>
  ),

  blockquote: ({ children }) => (
    <blockquote
      style={{
        background: 'rgba(245, 166, 35, 0.08)',
        borderLeft: '3px solid var(--color-gold)',
        borderRadius: '0 12px 12px 0',
        padding: '12px 16px',
        margin: '16px 0',
        fontStyle: 'italic',
        color: 'var(--color-text)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </blockquote>
  ),

  strong: ({ children }) => (
    <strong style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
      {children}
    </strong>
  ),

  em: ({ children }) => (
    <em style={{ color: 'var(--color-gold)' }}>{children}</em>
  ),

  code: ({ inline, children, ...props }) => {
    if (inline) {
      return (
        <code
          style={{
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.85em',
            color: 'var(--color-accent)',
          }}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: '0.875em',
          color: 'var(--color-text)',
        }}
        {...props}
      >
        {children}
      </code>
    )
  },

  pre: ({ children }) => (
    <pre
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px',
        overflowX: 'auto',
        margin: '16px 0',
      }}
    >
      {children}
    </pre>
  ),

  hr: () => (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--color-border)',
        margin: '24px 0',
      }}
    />
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--color-accent)',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
      }}
    >
      {children}
    </a>
  ),

  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
        }}
      >
        {children}
      </table>
    </div>
  ),

  th: ({ children }) => (
    <th
      style={{
        background: 'rgba(37, 99, 235, 0.12)',
        border: '1px solid var(--color-border)',
        padding: '8px 12px',
        color: 'var(--color-accent)',
        fontFamily: 'Sora, sans-serif',
        fontWeight: 600,
        textAlign: 'left',
        fontSize: '0.85rem',
      }}
    >
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td
      style={{
        border: '1px solid var(--color-border)',
        padding: '8px 12px',
        color: 'var(--color-text)',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </td>
  ),

  tr: ({ children }) => (
    <tr
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </tr>
  ),
}

const MarkdownRenderer = ({ content }) => {
  if (!content) return null

  return (
    <div className="markdown-body" style={{ maxWidth: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
