import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import useSyllabusStore from '../store/syllabusStore'

const TopicAutocomplete = ({
  value,
  onChange,
  exam,
  placeholder = 'Search for a topic…',
}) => {
  const [query, setQuery] = useState(value || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const getFlatTopics = useSyllabusStore((s) => s.getFlatTopics)

  /* ── Filter topics ── */
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

  /* ── Debounced input handler ── */
  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    setHighlighted(-1)
    // Always propagate typed value to parent — allows free-form topic entry
    onChange && onChange(val)

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      filterTopics(val)
      setShowDropdown(true)
    }, 200)
  }

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Sync if value prop changes externally ── */
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value)
    }
  }, [value])

  /* ── Keyboard navigation ── */
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

  /* ── Highlight matching part ── */
  const highlightMatch = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark
          style={{
            background: 'rgba(79, 142, 247, 0.3)',
            color: '#4F8EF7',
            borderRadius: '2px',
            padding: '0 1px',
          }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Input ── */}
      <div className="relative">
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: query ? 'var(--color-accent)' : 'var(--color-muted)' }}
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
          className="input-field"
          style={{ paddingLeft: '2.5rem', paddingRight: query ? '2.5rem' : '1rem' }}
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 animate-slide-down"
          style={{
            background: 'rgba(19, 24, 38, 0.98)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {filtered.map((topic, i) => {
            const parts = topic.split(' > ')
            const subject = parts.slice(0, -1).join(' > ')
            const topicName = parts[parts.length - 1]

            return (
              <button
                key={topic}
                onClick={() => selectTopic(topic)}
                className="w-full px-4 py-3 text-left flex items-center gap-3 group transition-all duration-150"
                style={{
                  background:
                    highlighted === i
                      ? 'rgba(79, 142, 247, 0.12)'
                      : 'transparent',
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid rgba(42, 52, 80, 0.5)'
                      : 'none',
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      highlighted === i
                        ? 'rgba(79, 142, 247, 0.2)'
                        : 'rgba(42, 52, 80, 0.5)',
                  }}
                >
                  <Search size={12} style={{ color: highlighted === i ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: highlighted === i ? 'var(--color-text)' : 'var(--color-text)' }}
                  >
                    {highlightMatch(topicName, query)}
                  </p>
                  {subject && (
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {subject}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-accent)' }}
                />
              </button>
            )
          })}
        </div>
      )}

      {/* ── No results ── */}
      {showDropdown && query.length >= 2 && filtered.length === 0 && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(19, 24, 38, 0.98)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="px-4 py-3">
            <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
              No saved topics match — using your text directly
            </p>
          </div>
          <button
            onClick={() => { setShowDropdown(false) }}
            className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-150 hover:bg-white/5"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,142,247,0.15)' }}>
              <Search size={12} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Use <em style={{ color: 'var(--color-accent)', fontStyle: 'normal', fontWeight: 600 }}>"{query}"</em></p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Generate questions on this custom topic</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default TopicAutocomplete
