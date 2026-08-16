import { useRef, useState } from 'react'
import ContextMenu, { CtxItem } from './ContextMenu'

export default function Select({ value, onChange, options, placeholder = 'Auswählen …', style }) {
  const btnRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const current = options.find((o) => o.value === value)

  function openMenu(e) {
    e.stopPropagation()
    const r = btnRef.current.getBoundingClientRect()
    setPos({ x: r.left, y: r.bottom + 4 })
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="text-input"
        onClick={openMenu}
        style={{
          textAlign: 'left', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer', gap: 8, ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current ? current.label : placeholder}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 10, flexShrink: 0 }}>▾</span>
      </button>
      {open && pos && (
        <ContextMenu x={pos.x} y={pos.y} onClose={() => setOpen(false)}>
          {options.length === 0 && (
            <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--muted)' }}>Keine Optionen</div>
          )}
          {options.map((o) => (
            <CtxItem key={o.value} onClick={() => { onChange(o.value); setOpen(false) }}>
              {value === o.value ? '✓ ' : ''}{o.label}
            </CtxItem>
          ))}
        </ContextMenu>
      )}
    </>
  )
}
