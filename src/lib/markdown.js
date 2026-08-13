function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Bewusst minimal gehalten: kein voller Markdown-Standard, aber deckt die
// gängigsten Fälle in Kartenbeschreibungen ab. Escaped zuerst alles, damit
// kein beliebiges HTML eingeschleust werden kann (relevant für die
// öffentliche Nur-Lese-Freigabe).
export function renderMarkdownLite(text) {
  if (!text) return ''
  let html = escapeHtml(text)

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Aufeinanderfolgende "- " Zeilen zu einer <ul> gruppieren
  html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (match, pre, block) => {
    const items = block.trim().split('\n').map((line) => `<li>${line.replace(/^- /, '')}</li>`).join('')
    return `${pre}<ul style="margin:4px 0;padding-left:20px">${items}</ul>`
  })

  html = html.replace(/\n/g, '<br/>')
  return html
}
