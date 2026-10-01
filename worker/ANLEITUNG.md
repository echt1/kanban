# Cloudflare Worker einrichten

1. dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker (Name z.B. kanban-auth) -> Deploy
2. "Edit code": kompletten Inhalt durch worker.js ersetzen -> Deploy
3. Storage & Databases -> KV -> Create namespace "kanban-links"
4. Worker -> Settings -> Bindings -> Add -> KV namespace: Variable name LINKS, Namespace kanban-links
5. Worker -> Settings -> Variables and Secrets:
   - Text: DISCORD_CLIENT_ID = 1399746537914896485
   - Secret: DISCORD_CLIENT_SECRET = (Discord Portal -> OAuth2 -> Client Secret)
   - Secret: FIREBASE_SERVICE_ACCOUNT = kompletter Inhalt der Service-Account-JSON
6. Worker-URL (https://kanban-auth.DEINNAME.workers.dev) als GitHub-Secret VITE_AUTH_WORKER_URL eintragen
7. Discord Portal -> Activities -> URL Mappings: /auth-api -> kanban-auth.DEINNAME.workers.dev
