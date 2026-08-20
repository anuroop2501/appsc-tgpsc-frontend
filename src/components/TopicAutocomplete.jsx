import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

const TopicAutocomplete = ({
  value,
  onChange,
  exam,
  placeholder = 'e.g. Fundamental Rights, Andhra Pradesh Economy…',
}) => {
  const [query, setQuery] = useState(value || '')
  const inputRef = useRef(null)

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange && onChange(val)
  }

  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value)
    }
  }, [value])

  const clear = () => {
    setQuery('')
    onChange && onChange('')
    inputRef.current?.focus()
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Input ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: query ? 'var(--indigo)' : 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={placeholder}
          className="input"
          style={{
            width: '100%',
            height: 46,
            paddingLeft: 42,
            paddingRight: query ? 40 : 14,
            fontSize: 14,
            fontWeight: 500,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 4,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default TopicAutocomplete
