import { useRef, useState } from 'react'
import ContextMenu from './ContextMenu'

export default function ConfirmButton({ onConfirm, label = '×', confirmText = 'Wirklich löschen?', className, style, title }) {
  const btnRef = useRef(null)
  const [pos, setPos] = useState(null)

  function open(e) {
    e.preventDefault()
    e.stopPropagation()
    const r = btnRef.current.getBoundingClientRect()
    setPos({ x: r.right - 200, y: r.bottom + 4 })
  }

  return (
    <>
      <button ref={btnRef} type="button" className={className} style={style} title={title} onClick={open}>
        {label}
      </button>
      {pos && (
        <ContextMenu x={pos.x} y={pos.y} onClose={() => setPos(null)}>
          <div style={{ padding: '6px 10px 8px', fontSize: 13, maxWidth: 200 }}>{confirmText}</div>
          <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px' }}>
            <button
              className="btn-danger"
              style={{ fontSize: 12, padding: '5px 10px', flex: 1 }}
              onClick={(e) => { e.stopPropagation(); setPos(null); onConfirm() }}
            >
              Löschen
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '5px 10px', flex: 1 }}
              onClick={(e) => { e.stopPropagation(); setPos(null) }}
            >
              Abbrechen
            </button>
          </div>
        </ContextMenu>
      )}
    </>
  )
}
