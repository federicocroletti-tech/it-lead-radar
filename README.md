# it-lead-radar

Piccola applicazione Node.js + TypeScript che monitora periodicamente fonti pubbliche (versione 1: Reddit) per trovare nuovi post potenzialmente interessanti per servizi informatici, sviluppo software, siti web, ecommerce, automazioni e consulenze IT.

Quando trova un post rilevante, invia una mail tramite Brevo.

## Stack

- Node.js
- TypeScript
- Reddit public JSON endpoint
- Brevo API (SMTP email endpoint)
- GitHub Actions (job ogni 30 minuti)
- File locale JSON per deduplica

## Struttura progetto

```text
it-lead-radar/
  src/
    index.ts
    config.ts
    models/
      lead-post.ts
    sources/
      reddit.source.ts
    services/
      scoring.service.ts
      dedupe.service.ts
      brevo-mail.service.ts
      logger.service.ts
  data/
    notified-posts.json
  .github/
    workflows/
      monitor.yml
  package.json
  tsconfig.json
  .env.example
  README.md
  .gitignore
```

## Setup locale

1. Installa dipendenze:

```bash
npm install
```

2. Crea file `.env` partendo da `.env.example` e compila le variabili:

```env
BREVO_API_KEY=
ALERT_EMAIL_TO=
ALERT_EMAIL_FROM=
REDDIT_USER_AGENT=it-lead-radar/1.0 by Federico
```

3. Compila il progetto:

```bash
npm run build
```

4. Avvia il monitor:

```bash
npm start
```

Per sviluppo locale rapido puoi usare:

```bash
npm run dev
```

Nota su DRY_RUN:

- Con `DRY_RUN=true` i secrets Brevo/email non sono obbligatori.
- Con `DRY_RUN=false` sono obbligatori:
  - `BREVO_API_KEY`
  - `ALERT_EMAIL_TO`
  - `ALERT_EMAIL_FROM`

## Configurazione

La configurazione principale e in `src/config.ts`.

Contiene:

- lista subreddit iniziale
- keyword positive e negative
- soglia minima punteggio
- variabili Brevo e email

Puoi sovrascrivere i subreddit con variabile ambiente opzionale `SUBREDDITS` (separati da virgola) e la soglia con `MIN_SCORE`.

## GitHub Actions

Il workflow e in `.github/workflows/monitor.yml`.

Fa:

- trigger schedulato ogni 30 minuti
- trigger manuale (`workflow_dispatch`)
- install dipendenze (`npm ci`)
- build (`npm run build`)
- run (`npm start`)
- commit automatico di `data/notified-posts.json` quando cambia

## Configurazione GitHub

### 1) Repository Secrets

Vai su GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`.

Inserisci questi secret:

- `BREVO_API_KEY`
- `ALERT_EMAIL_TO`
- `ALERT_EMAIL_FROM`
- `FACEBOOK_PAGE_ACCESS_TOKEN`

### 2) Repository Variables

Vai su GitHub: `Settings` -> `Secrets and variables` -> `Actions` -> tab `Variables` -> `New repository variable`.

Inserisci queste variabili:

- `REDDIT_ENABLED`
- `RSS_ENABLED`
- `HACKER_NEWS_ENABLED`
- `FACEBOOK_PAGE_ENABLED`
- `FACEBOOK_MESSENGER_ENABLED`
- `REDDIT_USER_AGENT`
- `REDDIT_SUBREDDITS`
- `RSS_FEEDS`
- `FACEBOOK_GRAPH_API_VERSION`
- `FACEBOOK_PAGE_ID`
- `DRY_RUN`
- `MIN_SCORE`

### 3) Avvio manuale workflow

Per lanciare il monitor manualmente:

- apri tab `Actions` nel repository
- seleziona workflow `IT Lead Radar Monitor`
- clicca `Run workflow`

### 4) Schedulazione automatica

Il workflow ha cron `*/30 * * * *`, quindi viene avviato automaticamente ogni 30 minuti.

### 5) Commit automatico del file di deduplica

Dopo `npm start`, il workflow controlla `data/notified-posts.json`.

- Se il file e cambiato, esegue commit e push con:
  - user.name: `github-actions[bot]`
  - user.email: `github-actions[bot]@users.noreply.github.com`
  - message: `chore: update notified posts`
- Se il file non e cambiato, stampa `No notified posts changes` e termina senza errore.

Questo serve a mantenere persistente la deduplica tra esecuzioni schedulate di GitHub Actions.

## Limiti prima versione

- Nessun database: la deduplica usa `data/notified-posts.json`
- Solo Reddit come fonte
- Scoring basato su keyword statiche

### Nota importante su GitHub Actions e deduplica

GitHub Actions non mantiene automaticamente le modifiche a `data/notified-posts.json` tra run diversi.

Per una deduplica persistente su Actions puoi:

- salvare il file come artifact/cache
- usare un piccolo database esterno
- fare commit automatico del file `data/notified-posts.json` (se accetti questo compromesso)

## Prossimi sviluppi

- aggiunta fonte RSS
- aggiunta fonte Hacker News
- dashboard web
- deduplica persistente con database
- classificazione AI dei post
