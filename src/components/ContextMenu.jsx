import { useEffect, useRef, useState } from 'react'

// Hook: liefert onContextMenu-Handler + aktuellen Menü-State für eine Komponente.
// triggerRef muss auf das auslösende Element gesetzt werden, damit ein erneuter
// Klick auf genau dieses Element das Menü schließt statt es sofort wieder zu öffnen.
export function useContextMenu() {
  const [menu, setMenu] = useState(null) // { x, y } | null
  const triggerRef = useRef(null)

  function open(e) {
    e.preventDefault()
    e.stopPropagation()
    setMenu((prev) => (prev ? null : { x: e.clientX, y: e.clientY }))
  }

  function close() {
    setMenu(null)
  }

  return { menu, open, close, triggerRef }
}

export default function ContextMenu({ x, y, onClose, excludeRef, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x, y })

  useEffect(() => {
    // Menü innerhalb des Viewports halten
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = Math.min(x, window.innerWidth - rect.width - 12)
    const ny = Math.min(y, window.innerHeight - rect.height - 12)
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) })
  }, [x, y])

  useEffect(() => {
    function isExcluded(target) {
      return !!(excludeRef?.current && excludeRef.current.contains(target))
    }
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target) && !isExcluded(e.target)) onClose()
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('contextmenu', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('contextmenu', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, excludeRef])

  return (
    <div ref={ref} className="ctx-menu" style={{ top: pos.y, left: pos.x }}>
      {children}
    </div>
  )
}

export function CtxItem({ onClick, danger, icon, children }) {
  return (
    <button className={`ctx-item${danger ? ' danger' : ''}`} onClick={onClick}>
      {icon && <span style={{ width: 16, textAlign: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}

export function CtxSectionLabel({ children }) {
  return <div className="ctx-section-label">{children}</div>
}

export function CtxDivider() {
  return <div className="ctx-divider" />
}

// Zweistufige Löschbestätigung INNERHALB desselben Menüs (kein Browser-confirm nötig)
export function CtxConfirm({ text = 'Wirklich löschen?', onConfirm, onCancel }) {
  return (
    <div>
      <div style={{ padding: '6px 10px 10px', fontSize: 13, maxWidth: 200 }}>{text}</div>
      <div style={{ display: 'flex', gap: 6, padding: '0 8px 8px' }}>
        <button className="btn-danger" style={{ fontSize: 12, padding: '5px 10px', flex: 1 }} onClick={onConfirm}>
          Löschen
        </button>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', flex: 1 }} onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}
