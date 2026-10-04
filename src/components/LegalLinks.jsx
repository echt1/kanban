import { isDiscord, sdk } from '../discord'

export const PRIVACY_URL = 'https://docs.google.com/document/d/1RhyGDrAn_3ToXwbwSOd25BgFulSM8np-jfOLTx8F3T8/edit?usp=sharing'
export const TERMS_URL = 'https://docs.google.com/document/d/1c8LUB4zkZAK4zBn2WPJ9vjGnbfQiNfmjt8Vovyj-9Us/edit?usp=sharing'

// In Discord sind normale Links gesperrt, dort öffnet Discord sie über openExternalLink
function open(e, url) {
  if (isDiscord && sdk) {
    e.preventDefault()
    sdk.commands.openExternalLink({ url }).catch(() => {})
  }
}

export default function LegalLinks({ style }) {
  const link = { color: 'var(--muted)', textDecoration: 'underline' }
  return (
    <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', ...style }}>
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={link} onClick={(e) => open(e, PRIVACY_URL)}>
        Datenschutz / Privacy Policy
      </a>
      {' · '}
      <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" style={link} onClick={(e) => open(e, TERMS_URL)}>
        Nutzungsbedingungen / Terms
      </a>
    </p>
  )
}
