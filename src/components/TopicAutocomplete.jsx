import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import useSyllabusStore from '../store/syllabusStore'

const TopicAutocomplete = ({
  value,
  onChange,
  exam,
  placeholder = 'e.g. Fundamental Rights, Andhra Pradesh Economy…',
}) => {
  const [query, setQuery] = useState(value || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const getFlatTopics = useSyllabusStore((s) => s.getFlatTopics)

  const filterTopics = useCallback(
    (q) => {
      if (!q || q.length < 2) {
        setFiltered([])
        return
      }
      const flat = getFlatTopics(exam)
      const lower = q.toLowerCase()
      const results = flat
        .filter((t) => t.toLowerCase().includes(lower))
        .slice(0, 8)
      setFiltered(results)
    },
    [exam, getFlatTopics]
  )

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    setHighlighted(-1)
    onChange && onChange(val)

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      filterTopics(val)
      setShowDropdown(true)
    }, 200)
  }

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value)
    }
  }, [value])

  const handleKeyDown = (e) => {
    if (!showDropdown || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      selectTopic(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const selectTopic = (topic) => {
    setQuery(topic)
    setShowDropdown(false)
    setFiltered([])
    onChange && onChange(topic)
  }

  const clear = () => {
    setQuery('')
    setFiltered([])
    setShowDropdown(false)
    onChange && onChange('')
    inputRef.current?.focus()
  }

  const highlightMatch = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark
          style={{
            background: 'var(--indigo-dim)',
            color: 'var(--indigo)',
            borderRadius: '2px',
            padding: '0 2px',
            fontWeight: 600,
          }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
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
          }}
        >
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => {
            if (filtered.length > 0) setShowDropdown(true)
          }}
          onKeyDown={handleKeyDown}
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
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && filtered.length > 0 && (
        <div
          className="animate-slide-down"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 52,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {filtered.map((topic, i) => {
            const parts = topic.split(' > ')
            const subject = parts.slice(0, -1).join(' > ')
            const topicName = parts[parts.length - 1]

            return (
              <button
                key={topic}
                type="button"
                onClick={() => selectTopic(topic)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: highlighted === i ? 'var(--surface-elevated)' : 'transparent',
                  border: 'none',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'var(--indigo-dim)',
                    color: 'var(--indigo)',
                  }}
                >
                  <Search size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {highlightMatch(topicName, query)}
                  </p>
                  {subject && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subject}
                    </p>
                  )}
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              </button>
            )
          })}
        </div>
      )}

      {/* ── No results ── */}
      {showDropdown && query.length >= 2 && filtered.length === 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 52,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            zIndex: 50,
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
              No syllabus matches — custom topic will be used
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDropdown(false)}
            style={{
              width: '100%',
              padding: '10px 16px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
              <Search size={12} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-1)', margin: 0 }}>
              Use custom topic: <strong style={{ color: 'var(--indigo)' }}>"{query}"</strong>
            </p>
          </button>
        </div>
      )}
    </div>
  )
}

export default TopicAutocomplete
