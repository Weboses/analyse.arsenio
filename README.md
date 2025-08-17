# Arsenio.at Kosmetikstudio Landingpage

## 🚨 WICHTIG: Netlify Environment Variables Setup

**Diese Umgebungsvariablen MÜSSEN in Netlify gesetzt werden:**

### 1. Gehen Sie zu Netlify Dashboard:
```
https://app.netlify.com/sites/lucent-sunshine-7a75a1/settings/deploys
```

### 2. Scrollen Sie zu "Environment variables"

### 3. Fügen Sie diese Variablen hinzu:
```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

### 4. Nach dem Hinzufügen → "Deploy site" klicken

---

## ✅ Mit den Variablen funktioniert:
- ✅ Formular-Submission zu Supabase
- ✅ Lead-Speicherung in Datenbank
- ✅ Automatischer n8n-Webhook
- ✅ E-Mail-Analyse nach 3 Minuten
- ✅ Vollständige Pipeline

## ❌ Ohne die Variablen:
- ❌ Formular zeigt Fehlermeldung
- ❌ Keine Supabase-Verbindung
- ❌ Kein n8n-Webhook
- ❌ Keine E-Mail-Analyse

---

## Lokale Entwicklung

```bash
# 1. Dependencies installieren
npm install

# 2. .env Datei erstellen (basierend auf .env.example)
cp .env.example .env

# 3. Supabase-Werte in .env eintragen
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Development Server starten
npm run dev
```

## Build & Deploy

```bash
# Clean build
npm run build:clean

# Preview build
npm run preview
```

---

## System-Architektur

### Frontend (React + Vite)
- Landingpage mit Formular
- Tailwind CSS für Styling
- TypeScript für Type Safety

### Backend (Supabase)
- PostgreSQL Datenbank
- RPC-Funktion: `notify_new_lead`
- Edge Functions für Webhooks
- Row Level Security (RLS)

### Automation (n8n)
- Webhook-Empfang von Supabase
- Website-Analyse mit KI
- E-Mail-Versand nach 3 Minuten

### Deployment (Netlify)
- Automatisches Build & Deploy
- Environment Variables
- CDN & SSL

---

## Troubleshooting

### Problem: Leere Seite
**Lösung:** Environment Variables in Netlify setzen

### Problem: Formular funktioniert nicht
**Lösung:** Supabase-Konfiguration prüfen

### Problem: Keine E-Mails
**Lösung:** n8n-Webhook-URL prüfen

---

## Support

Bei Problemen kontaktieren Sie:
- **E-Mail:** office@arsenio.at
- **Website:** https://arsenio.at