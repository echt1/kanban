import { useRef, useState } from 'react'
import ContextMenu from './ContextMenu'

export default function ConfirmButton({ onConfirm, label = '×', confirmText = 'Wirklich löschen?', className, style, title }) {
  const btnRef = useRef(null)
  const [pos, setPos] = useState(null)

  function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const popoverWidth = 200
    const fitsRight = r.right + 8 + popoverWidth < window.innerWidth
    const x = fitsRight ? r.right + 8 : Math.max(8, r.left - 8 - popoverWidth)
    setPos({ x, y: r.top })
  }

  return (
    <>
      <button ref={btnRef} type="button" className={className} style={style} title={title} onClick={toggle}>
        {label}
      </button>
      {pos && (
        <ContextMenu x={pos.x} y={pos.y} onClose={() => setPos(null)} excludeRef={btnRef}>
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
