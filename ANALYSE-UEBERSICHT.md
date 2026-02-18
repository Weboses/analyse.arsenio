# Website-Analyse Tool - Komplette Übersicht

## Was wir AKTUELL sammeln und analysieren

### 1. PERFORMANCE (Google PageSpeed Insights API)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| Performance Score | 0-100 Score für Mobile & Desktop | ✅ Ja |
| SEO Score | 0-100 Google Lighthouse SEO Score | ✅ Ja |
| Accessibility Score | 0-100 Barrierefreiheit | ✅ Ja |
| Best Practices Score | 0-100 Best Practices | ❌ Nein (haben wir aber) |
| **Core Web Vitals** | | |
| - LCP (Largest Contentful Paint) | Ladezeit des größten Elements | ✅ Ja |
| - FCP (First Contentful Paint) | Zeit bis erstes Element sichtbar | ✅ Ja |
| - CLS (Cumulative Layout Shift) | Visuelles Springen | ✅ Ja |
| - TBT (Total Blocking Time) | Blockierzeit | ❌ Nein |
| - Speed Index | Wie schnell wird Inhalt sichtbar | ❌ Nein |
| - Time to Interactive | Wann ist Seite bedienbar | ❌ Nein |
| **Seitengewicht** | | |
| - Gesamtgröße | Alle Ressourcen in KB/MB | ❌ Nein |
| - Anzahl Requests | Wie viele HTTP-Anfragen | ❌ Nein |
| **Optimierungspotenzial** | | |
| - Ungenutztes JavaScript | Mögliche Einsparung | ❌ Nein |
| - Ungenutztes CSS | Mögliche Einsparung | ❌ Nein |
| - Bildoptimierung | WebP/AVIF potenzial | ❌ Nein |
| - Textkomprimierung | GZIP/Brotli Status | ❌ Nein |
| Screenshot | Vorschau der Seite | ❌ Nein |

### 2. SEO ON-PAGE (Eigener Scraper)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| **Meta Tags** | | |
| - Title | Seitentitel | ✅ Ja |
| - Title Länge | Zeichen (ideal: 50-60) | ✅ Ja |
| - Meta Description | Beschreibung | ❌ Nein (nur Länge) |
| - Meta Description Länge | Zeichen (ideal: 150-160) | ✅ Ja |
| - Meta Keywords | Falls vorhanden | ❌ Nein |
| - Canonical URL | Für Duplicate Content | ❌ Nein |
| - Robots Meta | Index/Noindex | ❌ Nein |
| - Sprache (lang) | DE, EN, etc. | ❌ Nein |
| - Author | Autor der Seite | ❌ Nein |
| - Generator | CMS Info | ❌ Nein (aber CMS ja) |
| **Open Graph (Social Media)** | | |
| - og:title | Facebook/LinkedIn Titel | ❌ Nein |
| - og:description | Facebook/LinkedIn Beschreibung | ❌ Nein |
| - og:image | Bild für Social Shares | ❌ Nein |
| **Twitter Cards** | | |
| - twitter:card | Art der Karte | ❌ Nein |
| - twitter:title | Twitter Titel | ❌ Nein |
| - twitter:image | Twitter Bild | ❌ Nein |
| **Überschriften** | | |
| - H1 (Anzahl & Text) | Hauptüberschrift | ✅ Ja |
| - H2 (Anzahl & Text) | Zwischenüberschriften | ✅ Ja (nur Anzahl) |
| - H3-H6 (Anzahl) | Weitere Überschriften | ❌ Nein |
| **Bilder** | | |
| - Anzahl gesamt | Alle Bilder | ✅ Ja |
| - Ohne Alt-Text | Fehlende Beschreibungen | ✅ Ja |
| - Mit Lazy Loading | Performance-optimiert | ❌ Nein |
| - Mit Dimensionen | Width/Height gesetzt | ❌ Nein |
| **Links** | | |
| - Interne Links | Links auf eigene Seite | ✅ Ja |
| - Externe Links | Links auf andere Seiten | ✅ Ja |
| - Nofollow Links | Rel="nofollow" | ❌ Nein |
| - Kaputte Links | 404 Fehler | ✅ Ja |
| - Leere Anker | Links ohne Text | ❌ Nein |
| **Content** | | |
| - Wortanzahl | Text auf der Seite | ❌ Nein |
| - Lesezeit | Geschätzte Lesezeit | ❌ Nein |
| - Textinhalt | Roher Text (für KI) | Intern für KI |

### 3. TECHNISCHE ANALYSE (Eigener Scraper)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| **Basis** | | |
| - HTTPS | SSL-Zertifikat | ✅ Ja |
| - Mobile Viewport | Responsive Design | ✅ Ja |
| - Favicon | Website-Icon | ❌ Nein |
| - robots.txt | Crawler-Anweisungen | ✅ Ja |
| - Sitemap.xml | Seitenverzeichnis | ✅ Ja |
| **CMS & Technologien** | | |
| - CMS erkannt | WordPress, Wix, etc. | ✅ Ja |
| - Frameworks | React, Vue, Angular, etc. | ❌ Nein |
| - CSS Frameworks | Bootstrap, Tailwind | ❌ Nein |
| - JavaScript Libs | jQuery, etc. | ❌ Nein |
| - CDN verwendet | Cloudflare, etc. | ❌ Nein |
| - Payment Systems | Stripe, PayPal | ❌ Nein |
| - Cookie Consent | DSGVO-Banner | ❌ Nein |
| **Tracking** | | |
| - Google Analytics | Installiert? | ❌ Nein |
| - Google Tag Manager | Installiert? | ❌ Nein |
| - Facebook Pixel | Installiert? | ❌ Nein |
| - Hotjar | Installiert? | ❌ Nein |
| **Structured Data** | | |
| - Schema.org vorhanden | JSON-LD | ❌ Nein |
| - Schema Types | LocalBusiness, Product, etc. | ❌ Nein |
| **PWA Features** | | |
| - Service Worker | Offline-Fähigkeit | ❌ Nein |
| - Web Manifest | App-Installation | ❌ Nein |
| **Performance-Hints** | | |
| - Async Scripts | Script loading | ❌ Nein |
| - Defer Scripts | Script loading | ❌ Nein |
| - Preconnect | DNS vorauflösen | ❌ Nein |
| - Preload | Ressourcen vorladen | ❌ Nein |
| - DOM Größe | Anzahl HTML-Elemente | ❌ Nein |
| - iFrames | Eingebettete Inhalte | ❌ Nein |

### 4. KONTAKT & SOCIAL (Eigener Scraper)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| - E-Mail Adressen | Gefundene Mails | ❌ Nein |
| - Telefonnummern | Gefundene Nummern | ❌ Nein |
| - Adressen | Geschäftsadressen | ❌ Nein |
| - Kontaktformular | Vorhanden? | ❌ Nein |
| **Social Media Links** | | |
| - Facebook | Link vorhanden? | ❌ Nein |
| - Instagram | Link vorhanden? | ❌ Nein |
| - LinkedIn | Link vorhanden? | ❌ Nein |
| - Twitter/X | Link vorhanden? | ❌ Nein |
| - YouTube | Link vorhanden? | ❌ Nein |
| - TikTok | Link vorhanden? | ❌ Nein |
| - WhatsApp | Link vorhanden? | ❌ Nein |

### 5. BARRIEREFREIHEIT (Eigener Scraper)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| - Skip Link | Zum Inhalt springen | ❌ Nein |
| - Main Landmark | `<main>` Element | ❌ Nein |
| - Nav Landmark | `<nav>` Element | ❌ Nein |
| - ARIA Labels | Screenreader-Texte | ❌ Nein |
| - Form Labels | Beschriftete Felder | ❌ Nein |
| - Tabindex Probleme | Falsche Tab-Reihenfolge | ❌ Nein |
| - Kontrast Hinweis | Farbkontrast-Warnung | ❌ Nein |

### 6. SICHERHEIT (Eigener Scraper)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| - Security Score | 0-100 basierend auf Headers | ✅ Ja |
| - HTTPS | SSL aktiv | ✅ Ja |
| - Mixed Content | HTTP in HTTPS-Seite | ❌ Nein |
| **Security Headers** | | |
| - HSTS | Strict Transport Security | ❌ Nein |
| - CSP | Content Security Policy | ❌ Nein |
| - X-Frame-Options | Clickjacking-Schutz | ❌ Nein |
| - X-Content-Type | MIME-Sniffing-Schutz | ❌ Nein |
| - Referrer-Policy | Referrer-Kontrolle | ❌ Nein |
| - Permissions-Policy | Feature-Berechtigungen | ❌ Nein |

### 7. DATAFORSEO (Externe API)

| Daten | Beschreibung | Aktuell angezeigt? |
|-------|--------------|-------------------|
| - Ranked Keywords | Keywords wo Domain rankt | ✅ Ja (wenn >2) |
| - Keyword Positionen | Google Ranking Position | ✅ Ja |
| - Suchvolumen | Monatliche Suchanfragen | ✅ Ja |
| - Backlinks Anzahl | Gesamt-Backlinks | ✅ Ja |
| - Referring Domains | Verweisende Domains | ✅ Ja |
| - Domain Rank | Autorität der Domain | ❌ Nein |
| - Top Backlinks | Beste Backlink-Quellen | ❌ Nein |
| - Konkurrenten | Ähnliche Websites | ❌ Nein |

---

## Was wir NOCH NICHT haben aber HINZUFÜGEN könnten

### 1. DESIGN-ANALYSE (Neu zu entwickeln)

| Feature | Beschreibung | Schwierigkeit | Verkaufswert |
|---------|--------------|---------------|--------------|
| **Farbpalette extrahieren** | Alle verwendeten Farben | Mittel | ⭐⭐⭐⭐⭐ |
| - Primärfarbe | Hauptfarbe der Marke | | |
| - Sekundärfarben | Akzentfarben | | |
| - Hintergrundfarben | Neutrale Töne | | |
| - Farbharmonie-Check | Passen Farben zusammen? | | |
| - Farbkontrast WCAG | Barrierefreie Kontraste | | |
| **Typografie erkennen** | Schriftarten der Website | Mittel | ⭐⭐⭐⭐ |
| - Überschriften-Font | z.B. "Montserrat" | | |
| - Body-Font | z.B. "Open Sans" | | |
| - Font-Größen | Hierarchie korrekt? | | |
| - Zeilenabstand | Lesbarkeit | | |
| **Layout-Analyse** | Struktur der Seite | Schwer | ⭐⭐⭐ |
| - Seitenbreite | Max-width verwendet? | | |
| - Whitespace | Genug Abstand? | | |
| - Grid-System | Responsive Grid? | | |
| - Mobile Navigation | Hamburger-Menü? | | |

### 2. CONTENT-QUALITÄT (Neu zu entwickeln)

| Feature | Beschreibung | Schwierigkeit | Verkaufswert |
|---------|--------------|---------------|--------------|
| **Textqualität** | | | |
| - Lesbarkeits-Score | Flesch Reading Ease | Einfach | ⭐⭐⭐⭐ |
| - Satzlänge | Durchschnitt | | |
| - Keyword-Dichte | Haupt-Keywords | | |
| - Duplicate Content | Innerhalb der Seite | | |
| **Call-to-Actions** | | | |
| - CTA vorhanden | Buttons gefunden | Einfach | ⭐⭐⭐⭐⭐ |
| - CTA-Texte | "Jetzt kaufen", etc. | | |
| - Telefon prominent | Klickbare Nummer | | |
| **Vertrauenselemente** | | | |
| - Impressum-Link | DSGVO-Pflicht | Einfach | ⭐⭐⭐⭐ |
| - Datenschutz-Link | DSGVO-Pflicht | | |
| - Kundenbewertungen | Google Reviews etc. | | |
| - Zertifikate/Siegel | Trusted Shops etc. | | |

### 3. WETTBEWERBS-ANALYSE (DataForSEO erweitern)

| Feature | Beschreibung | Schwierigkeit | Verkaufswert |
|---------|--------------|---------------|--------------|
| - Konkurrenten zeigen | Wer rankt für gleiche Keywords | Mittel | ⭐⭐⭐⭐⭐ |
| - Traffic-Vergleich | Geschätzter Traffic vs. Konkurrenz | | |
| - Keyword-Overlap | Gemeinsame Keywords | | |
| - Backlink-Vergleich | Wer hat mehr Authority | | |

### 4. BRANCHEN-SPEZIFISCH (Für Kosmetikstudios)

| Feature | Beschreibung | Verkaufswert |
|---------|--------------|--------------|
| - Online-Buchung | Calendly/Bookly vorhanden? | ⭐⭐⭐⭐⭐ |
| - Preisliste | Sichtbar auf Website? | ⭐⭐⭐⭐ |
| - Google Maps | Standort eingebunden? | ⭐⭐⭐⭐ |
| - Öffnungszeiten | Schema.org vorhanden? | ⭐⭐⭐⭐ |
| - Vorher/Nachher Bilder | Portfolio vorhanden? | ⭐⭐⭐ |
| - Team-Seite | Mitarbeiter vorgestellt? | ⭐⭐⭐ |

---

## KONKURRENZ-ANALYSE: Was andere Tools machen

### SEOptimer (seoptimer.com)
- 100+ Datenpunkte
- PDF-Reports in 20 Sekunden
- White-Label Reports
- Design-Analyse (Farben, Fonts)
- Social Media Check
- Preis: Ab $19/Monat

### Semrush Site Audit (semrush.com)
- 26.2 Milliarden Keywords
- Konkurrenz-Analyse
- Backlink-Tracking
- Technischer Audit
- Preis: Ab $139/Monat

### Neil Patel SEO Analyzer (neilpatel.com)
- Priorisierte Empfehlungen
- Video-Tutorials
- Traffic-Schätzungen
- Kostenlos (mit Limits)

### Was wir BESSER machen können:
1. **KI-Personalisierung** - Wir nutzen Claude für individuelle Texte
2. **Branchen-Fokus** - Speziell für Kosmetikstudios
3. **Deutscher Markt** - Alles auf Deutsch, DSGVO-konform
4. **Persönlicher Service** - Direktes Beratungsgespräch

---

## EMPFOHLENE NÄCHSTE SCHRITTE

### Phase 1: Sofort umsetzbar (1-2 Tage)
1. ✅ Mehr bereits gesammelte Daten anzeigen:
   - Wortanzahl
   - Best Practices Score
   - Social Media Links
   - E-Mail/Telefon gefunden
   - Tracking-Tools (GA, GTM)
   - Screenshot der Website

### Phase 2: Kurzzfristig (1 Woche)
2. Design-Analyse hinzufügen:
   - Farbpalette extrahieren
   - Fonts erkennen
   - Visuelle Bewertung

### Phase 3: Mittelfristig (2-4 Wochen)
3. Content-Analyse erweitern:
   - Lesbarkeits-Score
   - Call-to-Action Check
   - Trust-Elemente prüfen
4. Branchen-spezifische Checks:
   - Online-Buchung
   - Google Maps
   - Preisliste

---

## Quellen für Marktforschung
- [SEOptimer](https://www.seoptimer.com/) - Umfassender SEO Auditor
- [Semrush](https://www.semrush.com/siteaudit/) - Enterprise SEO Tool
- [Neil Patel](https://neilpatel.com/seo-analyzer/) - Kostenloser Analyzer
- [Brand Element Extractor](https://chromewebstore.google.com/detail/brand-element-extractor/gaenmhdlokogeeglalgddpjebcfghepb) - Design-Extraktion
- [Folge.me Color Extractor](https://folge.me/tools/website-color-extractor) - Farbpaletten
