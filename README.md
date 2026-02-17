# Website-Analyse Tool

Ein professionelles Website-Analyse-Tool für Kosmetikstudios mit KI-Empfehlungen, gebaut mit Next.js 14, Turso, und Claude AI.

## Features

- **Performance-Analyse**: Google PageSpeed Insights API (Mobile & Desktop)
- **SEO-Analyse**: Meta-Tags, Headings, Alt-Tags, Structured Data
- **Technische Analyse**: SSL, Mobile-Friendly, CMS-Erkennung
- **KI-Empfehlungen**: Personalisierte Tipps von Claude AI
- **E-Mail-Berichte**: Automatischer Versand via Brevo

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Datenbank**: Turso (SQLite Edge)
- **E-Mail**: Brevo (Sendinblue)
- **KI**: Claude API (Anthropic)
- **Hosting**: Vercel

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Environment Variables

Erstelle eine `.env.local` Datei basierend auf `.env.example`:

```bash
cp .env.example .env.local
```

Fülle die Variablen aus:

```env
# Turso Database - https://turso.tech
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Brevo (E-Mail) - https://app.brevo.com/settings/keys/api
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx

# Claude API (Anthropic) - https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Google PageSpeed API (optional) - https://console.cloud.google.com
PAGESPEED_API_KEY=AIzaxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Turso Datenbank Setup

1. Erstelle einen Account bei [turso.tech](https://turso.tech)
2. Erstelle eine neue Datenbank
3. Kopiere die URL und den Auth Token
4. Führe die Migration aus:

```bash
# Mit Turso CLI
turso db shell your-database < drizzle/0000_init.sql

# Oder mit Drizzle Kit
npx drizzle-kit push
```

### 4. Brevo Setup

1. Erstelle einen Account bei [brevo.com](https://brevo.com)
2. Gehe zu Settings > API Keys
3. Erstelle einen neuen API Key
4. Verifiziere deine Sender-Domain (optional aber empfohlen)

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## Deployment auf Vercel

1. Pushe das Projekt zu GitHub
2. Verbinde das Repo mit Vercel
3. Füge die Environment Variables hinzu
4. Deploy!

```bash
# Oder via CLI
npx vercel
```

## Projektstruktur

```
website-analyse/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts  # Haupt-Analyse-Endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landingpage
│   ├── db/
│   │   └── schema.ts             # Datenbank-Schema
│   └── lib/
│       ├── turso.ts              # Datenbank-Client
│       ├── pagespeed.ts          # PageSpeed API
│       ├── scraper.ts            # Website Scraper
│       ├── claude.ts             # AI Recommendations
│       └── brevo.ts              # E-Mail Service
├── drizzle/
│   └── 0000_init.sql             # DB Migration
├── .env.example
└── README.md
```

## API Endpunkte

### POST /api/analyze

Startet eine neue Website-Analyse.

**Request:**
```json
{
  "firstName": "Maria",
  "email": "maria@beispiel.at",
  "websiteUrl": "https://kosmetik-maria.at"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analyse erfolgreich!",
  "leadId": "uuid",
  "analysisId": "uuid",
  "scores": {
    "performanceMobile": 75,
    "performanceDesktop": 90,
    "seo": 85,
    "accessibility": 80
  }
}
```

## Kosten

| Service | Kostenlos |
|---------|-----------|
| Vercel | Unlimited Deployments |
| Turso | 9 GB Storage |
| Brevo | 9000 Emails/Monat |
| PageSpeed API | 25.000/Tag |
| Claude API | ~0.01 Euro/Analyse |

**Total pro Analyse: ~0.01 Euro**

## Support

Bei Fragen: office@arsenio.at
