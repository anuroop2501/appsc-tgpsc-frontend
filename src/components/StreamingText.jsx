/**
 * StreamingText
 *
 * This component is intentionally a thin display wrapper.
 * The actual streaming logic lives in api/notes.js and is managed
 * by the parent page (NotesPage). This component renders the
 * progressively built text with a blinking cursor at the end.
 *
 * Props:
 *  - content   {string}  The accumulated text so far
 *  - isStreaming {bool}  Whether stream is still active (shows cursor)
 */
const StreamingText = ({ content, isStreaming }) => {
  return (
    <div className="relative">
      <span
        className="whitespace-pre-wrap text-sm leading-relaxed"
        style={{
          color: 'var(--color-text)',
          fontFamily: 'DM Sans, sans-serif',
          wordBreak: 'break-word',
        }}
      >
        {content}
        {isStreaming && (
          <span
            className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-sm"
            style={{
              background: 'var(--color-accent)',
              animation: 'pulseDot 1s ease-in-out infinite',
              verticalAlign: 'text-bottom',
            }}
          />
        )}
      </span>
    </div>
  )
}

export default StreamingText
