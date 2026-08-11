# Board

Dein privates Trello-artiges Kanban-Board. React + Firebase (Auth & Firestore), gehostet auf GitHub Pages. Kostenlos, kein Bezahlplan nötig (Firebase Spark / kostenloser Tier reicht).

## Was kann es schon?

- Mehrere Boards, jedes mit eigenen Listen (Spalten) und Karten
- Karten per Drag & Drop verschieben, zwischen Listen und innerhalb einer Liste
- Karten mit Beschreibung, Fälligkeitsdatum, Labels (frei benennbar)
- Login mit Google oder E-Mail/Passwort
- Koop: Board-Mitglieder per E-Mail einladen, Rechte über Firestore-Regeln abgesichert
- Automatisches Deployment auf GitHub Pages bei jedem Push

## 1. Firebase-Projekt einrichten (einmalig, ~5 Minuten)

1. Geh zu [console.firebase.google.com](https://console.firebase.google.com) → **Projekt hinzufügen** → Namen vergeben (Google Analytics kannst du abwählen, brauchst du nicht).
2. Im Projekt: **Build → Authentication → Los geht's**. Unter "Sign-in method" aktivierst du:
   - **Google** (einfach anklicken → aktivieren)
   - **E-Mail/Passwort** (aktivieren)
3. **Build → Firestore Database → Datenbank erstellen**. Region egal (z.B. `eur3 (europe-west)`), Modus: **Produktionsmodus**.
4. Sobald die Datenbank existiert: Reiter **Regeln** → Inhalt von `firestore.rules` (aus diesem Projekt) reinkopieren → **Veröffentlichen**.
5. Zurück zur **Projektübersicht** (Zahnrad oben links → Projekteinstellungen) → runterscrollen zu "Meine Apps" → **Web-App hinzufügen** (</> Icon) → Namen vergeben, **Firebase Hosting NICHT aktivieren** (wir nutzen GitHub Pages).
6. Du bekommst ein Config-Objekt mit `apiKey`, `authDomain`, usw. Diese Werte brauchst du gleich.

## 2. Projekt lokal einrichten

```bash
npm install
cp .env.example .env.local
```

Trag in `.env.local` die Werte aus Schritt 1.6 ein:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Lokal testen:

```bash
npm run dev
```

Läuft dann auf `http://localhost:5173`.

## 3. Auf GitHub veröffentlichen

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create dein-board-name --public --source=. --push
```

(oder klassisch: Repo auf github.com anlegen, dann `git remote add origin ...` + `git push`)

### GitHub Pages aktivieren

1. Im Repo: **Settings → Pages** → unter "Build and deployment" → Source: **Deploy from a branch** → Branch: `gh-pages` / `root` (dieser Branch wird automatisch vom Workflow erstellt, taucht also erst nach dem ersten erfolgreichen Deploy auf).

### Firebase-Secrets für den automatischen Build hinterlegen

Damit GitHub Actions bei jedem Push bauen und deployen kann, ohne dass deine Keys im Repo landen:

**Settings → Secrets and variables → Actions → New repository secret**, und dort jeweils einzeln anlegen (Namen exakt so wie in `.env.local`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Danach: jeder `git push` auf `main` baut automatisch und deployed (`.github/workflows/deploy.yml`). Erster Push kann 1-2 Minuten dauern, danach ist die Seite unter `https://dein-username.github.io/dein-repo-name/` erreichbar (Tab **Actions** im Repo zeigt den Fortschritt).

### Google-Login auf GitHub Pages erlauben

Firebase blockt Google-Login von unbekannten Domains. Einmalig:

**Firebase Console → Authentication → Settings → Authorized domains → Domain hinzufügen** → `dein-username.github.io` eintragen.

## 4. Manuell deployen (Alternative zu GitHub Actions)

Falls du lieber manuell pushen willst statt automatisch:

```bash
npm run deploy
```

Das baut die App und pusht `dist/` in den `gh-pages`-Branch (nutzt das `gh-pages`-npm-Paket, das schon in `package.json` steht).

## Datenmodell (falls du später selbst was anpassen willst)

```
boards/{boardId}
  title, color, ownerId, members: [uid], memberEmails: [email], labels: [{id, name, color}]
  lists/{listId}          → title, order
  cards/{cardId}          → title, description, dueDate, labelIds[], listId, order
```

## Nächste mögliche Features (sag einfach Bescheid)

- Checklisten innerhalb von Karten
- Kalender-/Wochenansicht über alle Boards hinweg
- Kommentare pro Karte
- Board-Vorlagen
- Suche/Filter über Karten
- Dunkel-/Hell-Modus umschaltbar
- Datei-Anhänge an Karten (braucht Firebase Storage)
