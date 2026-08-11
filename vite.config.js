import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relativer Pfad ('./') sorgt dafür, dass die App egal unter welchem
// Unterpfad (z.B. https://user.github.io/repo-name/) funktioniert,
// ohne dass du den Repo-Namen hier eintragen musst.
export default defineConfig({
  plugins: [react()],
  base: './',
})
