import { generatePaletteGrid } from '../lib/colors'

export default function ColorGrid({ value, onChange, onClear, swatchSize = 28 }) {
  const grid = generatePaletteGrid()

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {grid.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6 }}>
            {row.map((c, ci) => (
              <button
                key={ci}
                type="button"
                onClick={() => onChange(c)}
                style={{
                  width: swatchSize, height: swatchSize, borderRadius: 6, background: c,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: value === c ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: value === c ? '0 0 0 1px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {value === c && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      {onClear && (
        <button type="button" className="btn-ghost" style={{ marginTop: 10, width: '100%', fontSize: 13 }} onClick={onClear}>
          × Farbe entfernen
        </button>
      )}
    </div>
  )
}
