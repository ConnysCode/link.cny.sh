# link.cny.sh

Ein kleiner URL-Shortener, den wir selbst hosten. Läuft unter [link.cny.sh](https://link.cny.sh) – kurze Links gehen über `l.cny.sh/<slug>`.

## Worum geht's

Man wirft eine lange URL rein, bekommt einen kurzen Slug zurück. Beim Anlegen zieht der Server einmal die OG-Tags der Zielseite (Titel, Beschreibung, Bild) und speichert sie. Wer den Link eingebettet teilt – in Slack, WhatsApp, iMessage, was auch immer – kriegt also eine anständige Vorschau, statt nur nackten Text.

Wenn einem die gescrapten OG-Daten nicht gefallen, kann man sie pro Link überschreiben. Eigenes Bild hochladen, Titel anpassen, fertig. Crawler sehen dann die Overrides, echte Besucher werden weiter auf die Ziel-URL umgeleitet.

## Wie es aufgebaut ist

Zwei Hosts, eine App:

- `link.cny.sh` – Frontend und Admin-Panel. Hier legt man Links an, verwaltet sie, sieht Click Counts.
- `l.cny.sh` – nur Redirects. Alles unter `/<slug>` wird intern auf die Redirect-Route gemappt und weiter­geleitet. Admin und API sind auf diesem Host gesperrt.

Die Trennung passiert in [src/proxy.ts](src/proxy.ts) per Host-Header.

Stack: Next.js 16 + Payload 3 + Postgres. Die Collection liegt in [src/collections/Links.ts](src/collections/Links.ts), OG-Scraping und Slug-Generierung als Hooks daneben. Es gibt zwei Rollen – `Admins` fürs Panel, `Users` für API-Nutzer, die eigene Links verwalten wollen.

## Lokal starten

```bash
cp .env.example .env        # DATABASE_URL und PAYLOAD_SECRET setzen
pnpm install
pnpm dev
```

Dann `http://localhost:3000/admin` aufmachen und den ersten Admin anlegen.

Für Postgres kann man entweder eine lokale Instanz nehmen oder das mitgelieferte `docker-compose.yml` starten.

## Scripts

- `pnpm dev` – Dev-Server
- `pnpm build` / `pnpm start` – Production-Build
- `pnpm generate:types` – Payload-Types neu bauen, wenn sich Collections ändern
- `pnpm test` – Integration- und E2E-Tests (Vitest + Playwright)
