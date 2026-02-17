import Anthropic from "@anthropic-ai/sdk";
import type { PageSpeedResult } from "./pagespeed";
import type { ScrapedData, RobotsSitemapResult, SecurityHeadersResult } from "./scraper";
import type { ComprehensiveAnalysis } from "./dataforseo";

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not defined");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 180000, // 3 Minuten für umfangreichen Report
    });
  }
  return anthropicClient;
}

// Retry wrapper
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Claude API attempt ${attempt + 1} failed: ${lastError.message}`);
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

interface AnalysisData {
  mobile: PageSpeedResult;
  desktop: PageSpeedResult;
  scraped: ScrapedData;
  brokenLinks: Array<{ url: string; status: number | string; type: string }>;
  robotsSitemap: RobotsSitemapResult;
  securityHeaders: SecurityHeadersResult;
  clientName: string;
  websiteUrl: string;
  // NEW
  seoAnalysis?: ComprehensiveAnalysis | null;
  extractedKeywords?: string[];
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getOverallGrade(scores: { performance: number; seo: number; security: number; accessibility: number }): string {
  const avg = (scores.performance + scores.seo + scores.security + scores.accessibility) / 4;
  return getGrade(avg);
}

export async function generateAnalysisReport(data: AnalysisData): Promise<string> {
  // Prepare comprehensive summary
  const scores = {
    performance: data.mobile.scores.performance,
    seo: data.mobile.scores.seo,
    security: data.securityHeaders.score,
    accessibility: data.mobile.scores.accessibility,
  };

  const overallGrade = getOverallGrade(scores);

  const summary = {
    // Grades
    overallGrade,
    grades: {
      performance: getGrade(scores.performance),
      seo: getGrade(scores.seo),
      security: getGrade(scores.security),
      accessibility: getGrade(scores.accessibility),
    },
    scores,

    // Performance
    performance: {
      mobile: data.mobile.scores.performance,
      desktop: data.desktop.scores.performance,
      lcp: data.mobile.coreWebVitals.lcp,
      fcp: data.mobile.coreWebVitals.fcp,
      cls: data.mobile.coreWebVitals.cls,
      tbt: data.mobile.coreWebVitals.tbt,
      speedIndex: data.mobile.coreWebVitals.speedIndex,
      opportunities: data.mobile.opportunities,
    },

    // SEO On-Page
    seoOnPage: {
      title: data.scraped.meta.title,
      titleLength: data.scraped.meta.titleLength,
      titleStatus: data.scraped.meta.titleLength > 30 && data.scraped.meta.titleLength < 60 ? "gut" : "optimieren",
      description: data.scraped.meta.description?.slice(0, 160) || "",
      descriptionLength: data.scraped.meta.descriptionLength,
      descriptionStatus: data.scraped.meta.descriptionLength > 120 && data.scraped.meta.descriptionLength < 160 ? "gut" : "optimieren",
      h1: data.scraped.headings.h1[0] || "FEHLT!",
      h1Count: data.scraped.headings.h1.length,
      h2Count: data.scraped.headings.h2.length,
      hasCanonical: !!data.scraped.meta.canonical,
      hasLang: !!data.scraped.meta.lang,
      robotsBlocked: data.scraped.meta.robots?.includes("noindex") || false,
    },

    // Images
    images: {
      total: data.scraped.images.total,
      missingAlt: data.scraped.images.missingAlt,
      lazyLoaded: data.scraped.images.lazyLoaded,
    },

    // Links
    links: {
      internal: data.scraped.links.internal,
      external: data.scraped.links.external,
      broken: data.brokenLinks.filter((l) => l.type === "broken").length,
      brokenUrls: data.brokenLinks.filter((l) => l.type === "broken").slice(0, 5).map((l) => l.url),
    },

    // Technical
    technical: {
      isHttps: data.scraped.security.isHttps,
      hasViewport: data.scraped.technical.hasViewport,
      hasFavicon: data.scraped.technical.hasFavicon,
      cms: data.scraped.technical.detectedCms,
      technologies: data.scraped.technical.detectedTechnologies.slice(0, 5),
      hasAnalytics: data.scraped.technical.hasGoogleAnalytics,
      hasStructuredData: data.scraped.technical.hasStructuredData,
      hasSitemap: data.robotsSitemap.hasSitemap,
      hasRobotsTxt: data.robotsSitemap.hasRobotsTxt,
    },

    // Security
    security: {
      score: data.securityHeaders.score,
      issues: data.securityHeaders.issues.slice(0, 5),
      recommendations: data.securityHeaders.recommendations.slice(0, 3),
    },

    // Contact
    contact: {
      hasEmail: data.scraped.contact.emails.length > 0,
      hasPhone: data.scraped.contact.phones.length > 0,
      hasForm: data.scraped.contact.hasContactForm,
      socialLinks: Object.keys(data.scraped.contact.socialLinks),
    },

    // Accessibility
    accessibility: {
      score: data.mobile.scores.accessibility,
      hasSkipLink: data.scraped.accessibility.hasSkipLink,
      hasAriaLabels: data.scraped.accessibility.hasAriaLabels,
      formsWithoutLabels: data.scraped.accessibility.formsWithoutLabels,
    },

    // DataForSEO Data (if available)
    seoAnalysis: data.seoAnalysis
      ? {
          domainRank: data.seoAnalysis.domainMetrics.domainRank,
          organicKeywords: data.seoAnalysis.domainMetrics.organicKeywords,
          backlinks: {
            total: data.seoAnalysis.backlinks.totalBacklinks,
            referringDomains: data.seoAnalysis.backlinks.referringDomains,
            domainRank: data.seoAnalysis.backlinks.domainRank,
          },
          rankings: data.seoAnalysis.rankings.slice(0, 10).map((r) => ({
            keyword: r.keyword,
            position: r.position,
            searchVolume: r.searchVolume,
          })),
          competitors: data.seoAnalysis.competitors.slice(0, 3).map((c) => ({
            domain: c.domain,
            organicKeywords: c.metrics.organicKeywords,
          })),
        }
      : null,

    extractedKeywords: data.extractedKeywords?.slice(0, 10) || [],
  };

  const prompt = `Du bist ein erfahrener SEO-Berater und Website-Analyst. Erstelle einen PROFESSIONELLEN, DETAILLIERTEN HTML-Report.

## KUNDENDATEN
- Name: ${data.clientName}
- Website: ${data.websiteUrl}

## ANALYSE-ERGEBNISSE
${JSON.stringify(summary, null, 2)}

## DEINE AUFGABE

Erstelle einen HTML-Report der wie eine ECHTE BERATUNG wirkt. Der Kunde soll denken "WOW, das ist mehr wert als ich erwartet habe!"

### WICHTIGE REGELN:
1. NUR HTML ausgeben - KEIN Markdown, KEINE Code-Blöcke, KEIN \`\`\`
2. Direkt mit <div> starten
3. Inline-CSS für E-Mail-Kompatibilität
4. Erkläre Fachbegriffe verständlich
5. Sei spezifisch mit Zahlen und Empfehlungen
6. Priorisiere Maßnahmen nach Impact

### REPORT-STRUKTUR:

<div style="max-width:680px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.6;">

  <!-- HEADER mit Gradient -->
  <div style="background:linear-gradient(135deg,#1e1b4b 0%,#7c3aed 50%,#ec4899 100%);padding:40px 30px;border-radius:16px 16px 0 0;text-align:center;">
    <img src="https://arsenio.at/logo-white.png" alt="arsenio" style="height:32px;margin-bottom:16px;" onerror="this.style.display='none'">
    <h1 style="color:white;font-size:28px;margin:0 0 8px 0;font-weight:700;">Website-Analyse Report</h1>
    <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">${data.websiteUrl}</p>
  </div>

  <!-- CONTENT BEREICH -->
  <div style="background:#ffffff;padding:30px;border:1px solid #e5e7eb;border-top:none;">

    <!-- 1. EXECUTIVE SUMMARY -->
    Persönliche Anrede, Gesamtnote (${overallGrade}), 3 wichtigste Erkenntnisse in einem Satz.

    <!-- 2. SCORE-ÜBERSICHT -->
    4 Score-Karten nebeneinander: Performance (${scores.performance}), SEO (${scores.seo}), Sicherheit (${scores.security}), Barrierefreiheit (${scores.accessibility})
    Farben: ≥80 grün #10b981, 50-79 gelb #f59e0b, <50 rot #ef4444

    <!-- 3. KEYWORD-ANALYSE (wenn DataForSEO vorhanden) -->
    ${summary.seoAnalysis ? `
    - Aktuell rankt die Seite für ${summary.seoAnalysis.organicKeywords} Keywords
    - Top Rankings: ${summary.seoAnalysis.rankings.map(r => `"${r.keyword}" (Pos. ${r.position || '>100'})`).join(", ")}
    - Keyword-Empfehlungen für Kosmetikstudio
    ` : "Zeige die extrahierten Keywords und erkläre welche wichtig wären."}

    <!-- 4. BACKLINK-PROFIL (wenn DataForSEO vorhanden) -->
    ${summary.seoAnalysis ? `
    - ${summary.seoAnalysis.backlinks.total} Backlinks von ${summary.seoAnalysis.backlinks.referringDomains} Domains
    - Domain-Autorität: ${summary.seoAnalysis.backlinks.domainRank}
    - Vergleich: Was ist gut/schlecht für die Branche
    ` : "Erkläre warum Backlinks wichtig sind."}

    <!-- 5. TECHNISCHE ANALYSE -->
    - Core Web Vitals erklärt (LCP: ${summary.performance.lcp}, CLS: ${summary.performance.cls})
    - Was bedeuten diese Werte konkret?
    - Mobile vs Desktop Performance

    <!-- 6. SEO ON-PAGE ANALYSE -->
    - Title Tag: "${summary.seoOnPage.title}" (${summary.seoOnPage.titleLength} Zeichen - ${summary.seoOnPage.titleStatus})
    - Meta Description: Status und Empfehlung
    - H1-Struktur: ${summary.seoOnPage.h1Count} H1 Tags
    - Bilder: ${summary.images.missingAlt} von ${summary.images.total} ohne Alt-Text

    <!-- 7. SICHERHEITS-CHECK -->
    - HTTPS: ${summary.technical.isHttps ? "✓" : "✗"}
    - Security Score: ${summary.security.score}/100
    - Top Sicherheitsprobleme

    <!-- 8. TOP 5-7 MASSNAHMEN -->
    Priorisierte Liste mit:
    - Priorität (Hoch/Mittel/Niedrig)
    - Konkrete Maßnahme
    - Erwarteter Impact
    - Geschätzter Aufwand

    Nutze farbige Boxen: Rot für kritisch, Orange für wichtig, Gelb für empfohlen

    <!-- 9. POSITIVES -->
    Was macht die Website bereits gut? (2-3 Punkte)

    <!-- 10. CTA -->
    Einladung zum kostenlosen Beratungsgespräch

  </div>

  <!-- FOOTER -->
  <div style="background:#111827;padding:24px 30px;border-radius:0 0 16px 16px;text-align:center;">
    <a href="https://calendly.com/arsenio-at" style="display:inline-block;background:linear-gradient(90deg,#ec4899,#8b5cf6);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:16px;">
      Kostenloses Beratungsgespräch vereinbaren
    </a>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0 0;">
      arsenio.at | office@arsenio.at | +43 660 150 3210
    </p>
  </div>

</div>

WICHTIG: Gib NUR das HTML aus. Kein Markdown. Keine Erklärungen. Direkt mit <div starten.`;

  return withRetry(async () => {
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      // Clean up any markdown artifacts
      let html = content.text;

      // Remove markdown code blocks if present
      html = html.replace(/```html\n?/gi, "");
      html = html.replace(/```\n?/gi, "");

      // Ensure it starts with <div
      const divStart = html.indexOf("<div");
      if (divStart > 0) {
        html = html.slice(divStart);
      }

      return html.trim();
    }

    throw new Error("Unexpected response from Claude");
  }, 3, 3000);
}
