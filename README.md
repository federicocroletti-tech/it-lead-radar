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

### GitHub Secrets richiesti

- `BREVO_API_KEY`
- `ALERT_EMAIL_TO`
- `ALERT_EMAIL_FROM`
- `REDDIT_USER_AGENT`

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
