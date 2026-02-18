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
      timeout: 60000, // 60 Sekunden reichen jetzt
    });
  }
  return anthropicClient;
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
  seoAnalysis?: ComprehensiveAnalysis | null;
  extractedKeywords?: string[];
}

interface AIContent {
  greeting: string;
  summary: string;
  keyInsights: string[];
  performanceAnalysis: string;
  seoAnalysis: string;
  securityAnalysis: string;
  recommendations: Array<{
    priority: "kritisch" | "hoch" | "mittel";
    title: string;
    description: string;
    impact: string;
  }>;
  positives: string[];
  conclusion: string;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getOverallGrade(scores: { performance: number; seo: number; security: number; accessibility: number }): string {
  const avg = (scores.performance + scores.seo + scores.security + scores.accessibility) / 4;
  return getGrade(avg);
}

function getPriorityColor(priority: string): { bg: string; border: string; text: string } {
  switch (priority) {
    case "kritisch":
      return { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" };
    case "hoch":
      return { bg: "#fff7ed", border: "#f97316", text: "#ea580c" };
    default:
      return { bg: "#fefce8", border: "#eab308", text: "#ca8a04" };
  }
}

// Safe number conversion - handles null, undefined, strings, NaN
function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

async function generateAIContent(data: AnalysisData, summary: Record<string, unknown>): Promise<AIContent> {
  const prompt = `Du bist ein erfahrener SEO-Berater. Analysiere diese Website-Daten und erstelle personalisierte Texte.

KUNDE: ${data.clientName}
WEBSITE: ${data.websiteUrl}

ANALYSE-DATEN:
${JSON.stringify(summary, null, 2)}

Erstelle ein JSON-Objekt mit diesen Feldern (auf Deutsch, professionell aber verständlich):

{
  "greeting": "Persönliche Begrüßung mit Namen (1 Satz)",
  "summary": "Executive Summary - Gesamteindruck der Website in 2-3 Sätzen. Erwähne die Gesamtnote und wichtigste Erkenntnis.",
  "keyInsights": ["3-4 wichtigste Erkenntnisse als kurze Bullet Points"],
  "performanceAnalysis": "Analyse der Ladezeit und Core Web Vitals in 2-3 Sätzen. Erkläre was LCP/CLS bedeuten.",
  "seoAnalysis": "SEO-Bewertung in 2-3 Sätzen. Title, Description, Keywords.",
  "securityAnalysis": "Sicherheitsbewertung in 1-2 Sätzen.",
  "recommendations": [
    {
      "priority": "kritisch|hoch|mittel",
      "title": "Kurzer Titel der Maßnahme",
      "description": "Was genau zu tun ist (1-2 Sätze)",
      "impact": "Erwartete Verbesserung"
    }
  ],
  "positives": ["2-3 positive Aspekte der Website"],
  "conclusion": "Abschlusssatz mit Einladung zur Beratung (1-2 Sätze)"
}

WICHTIG:
- Maximal 5-6 Empfehlungen, nach Priorität sortiert
- Sei konkret und spezifisch (nutze die echten Zahlen)
- Vermeide Fachjargon oder erkläre ihn
- Gib NUR valides JSON aus, keine Erklärungen davor oder danach`;

  try {
    console.log("Calling Claude API...");
    const response = await getAnthropic().messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    console.log("Claude API response received");

    const content = response.content[0];
    if (content.type !== "text") {
      console.error("Unexpected content type:", content.type);
      throw new Error("Unexpected response from Claude");
    }

    // Parse JSON from response
    let jsonText = content.text.trim();
    console.log("Claude response length:", jsonText.length, "chars");
    console.log("Claude response preview:", jsonText.substring(0, 200));

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/gi, "");
    jsonText = jsonText.replace(/```\n?/gi, "");

    // Find JSON object
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in response:", jsonText.substring(0, 500));
      throw new Error("No JSON found in Claude response");
    }
    jsonText = jsonText.slice(jsonStart, jsonEnd + 1);

    const parsed = JSON.parse(jsonText) as AIContent;
    console.log("JSON parsed successfully, keys:", Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error("Error generating AI content:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    // Return fallback content
    return {
      greeting: `Hallo ${data.clientName}!`,
      summary: `Ihre Website ${data.websiteUrl} wurde analysiert. Die Gesamtnote ist ${summary.overallGrade}. Es gibt einige Optimierungsmöglichkeiten.`,
      keyInsights: [
        `Performance-Score: ${(summary.scores as Record<string, number>).performance}`,
        `SEO-Score: ${(summary.scores as Record<string, number>).seo}`,
        `Sicherheits-Score: ${(summary.scores as Record<string, number>).security}`,
      ],
      performanceAnalysis: "Die Ladezeit und Core Web Vitals wurden analysiert. Optimierungen können die Nutzererfahrung verbessern.",
      seoAnalysis: "Die SEO-Grundlagen wurden geprüft. Title und Meta-Description sind wichtige Faktoren.",
      securityAnalysis: "Die Sicherheit wurde überprüft. HTTPS ist essentiell für moderne Websites.",
      recommendations: [
        {
          priority: "hoch",
          title: "Performance optimieren",
          description: "Bilder komprimieren und Ladezeiten verbessern.",
          impact: "Bessere Nutzererfahrung und SEO-Rankings",
        },
      ],
      positives: ["Website ist erreichbar", "Grundstruktur vorhanden"],
      conclusion: "Gerne besprechen wir die Ergebnisse in einem kostenlosen Beratungsgespräch.",
    };
  }
}

function buildHTMLReport(data: AnalysisData, aiContent: AIContent, summary: Record<string, unknown>): string {
  const scores = summary.scores as { performance: number; seo: number; security: number; accessibility: number };
  const grades = summary.grades as { performance: string; seo: string; security: string; accessibility: string };
  const overallGrade = summary.overallGrade as string;
  const performance = summary.performance as Record<string, unknown>;
  const seoOnPage = summary.seoOnPage as Record<string, unknown>;
  const images = summary.images as { total: number; missingAlt: number };
  const technical = summary.technical as Record<string, unknown>;
  const seoAnalysisData = summary.seoAnalysis as Record<string, unknown> | null;

  // Build recommendations HTML
  const recommendationsHTML = aiContent.recommendations
    .map((rec) => {
      const colors = getPriorityColor(rec.priority);
      return `
        <div style="background:${colors.bg};border-left:4px solid ${colors.border};padding:16px;margin-bottom:12px;border-radius:0 8px 8px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="color:${colors.text};font-size:15px;">${rec.title}</strong>
            <span style="background:${colors.border};color:white;padding:2px 8px;border-radius:12px;font-size:11px;text-transform:uppercase;">${rec.priority}</span>
          </div>
          <p style="margin:0 0 8px 0;color:#4b5563;font-size:14px;">${rec.description}</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">📈 ${rec.impact}</p>
        </div>`;
    })
    .join("");

  // Build positives HTML
  const positivesHTML = aiContent.positives
    .map((p) => `<li style="margin-bottom:8px;color:#065f46;">✓ ${p}</li>`)
    .join("");

  // Build key insights HTML
  const insightsHTML = aiContent.keyInsights
    .map((i) => `<li style="margin-bottom:6px;">${i}</li>`)
    .join("");

  // Rankings HTML (if DataForSEO available)
  // Only show rankings if there are multiple keywords or if keywords seem relevant
  let rankingsHTML = "";
  if (seoAnalysisData) {
    const rankings = seoAnalysisData.rankings as Array<{ keyword: string; position: number | null; searchVolume: number }>;
    const analyzedDomain = (seoAnalysisData as Record<string, unknown>).domain as string || "N/A";

    // Filter: Only show rankings with meaningful search volume (>50) and good positions (<50)
    const relevantRankings = rankings?.filter(r =>
      r.position !== null && r.position <= 50 && r.searchVolume >= 50
    ) || [];

    // Show rankings if we have relevant keywords, otherwise show opportunity message
    if (relevantRankings.length >= 2) {
      rankingsHTML = `
        <div style="margin-top:20px;">
          <h3 style="font-size:16px;color:#1f2937;margin:0 0 8px 0;">🔍 Aktuelle Google Rankings</h3>
          <p style="font-size:12px;color:#6b7280;margin:0 0 12px 0;">Keywords für die <strong>${analyzedDomain}</strong> in Google rankt:</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Keyword</th>
              <th style="text-align:center;padding:8px;border-bottom:1px solid #e5e7eb;">Position</th>
              <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Suchvolumen</th>
            </tr>
            ${relevantRankings.slice(0, 5).map((r) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${r.keyword}</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #f3f4f6;font-weight:600;color:${r.position && r.position <= 10 ? "#10b981" : r.position && r.position <= 30 ? "#f59e0b" : "#6b7280"};">${r.position || ">100"}</td>
                <td style="text-align:right;padding:8px;border-bottom:1px solid #f3f4f6;">${r.searchVolume?.toLocaleString() || "-"}/Monat</td>
              </tr>
            `).join("")}
          </table>
        </div>`;
    } else {
      // No rankings found - show opportunity message
      rankingsHTML = `
        <div style="margin-top:20px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;">
          <h3 style="font-size:16px;color:#92400e;margin:0 0 8px 0;">⚠️ Keine Google Rankings gefunden</h3>
          <p style="font-size:14px;color:#78350f;margin:0 0 12px 0;">
            Ihre Website <strong>${analyzedDomain}</strong> rankt derzeit für keine relevanten Keywords in den Top 50 bei Google Österreich.
          </p>
          <p style="font-size:13px;color:#92400e;margin:0;">
            <strong>Das bedeutet:</strong> Potenzielle Kunden, die nach Ihren Dienstleistungen suchen, finden Sie nicht über Google.
            Mit gezielter SEO-Optimierung können Sie das ändern und mehr Kunden erreichen.
          </p>
        </div>`;
    }
  }

  return `<div style="max-width:680px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;line-height:1.6;">

  <!-- CONTENT - Header/Footer kommen von E-Mail-Wrapper (brevo.ts) -->
  <div style="background:#ffffff;padding:30px;">

    <!-- WEBSITE URL + SCREENSHOT -->
    <div style="text-align:center;margin-bottom:24px;padding:16px;background:#f3f4f6;border-radius:8px;">
      <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Analyse für</p>
      <p style="margin:4px 0 0 0;font-size:18px;font-weight:600;color:#1f2937;">${data.websiteUrl}</p>
      ${(summary as Record<string, unknown>).screenshot ? `
      <div style="margin-top:16px;">
        <img src="${(summary as Record<string, unknown>).screenshot}" alt="Screenshot von ${data.websiteUrl}" style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
      </div>
      ` : ""}
    </div>

    <!-- GREETING & SUMMARY -->
    <p style="font-size:16px;margin:0 0 16px 0;">${aiContent.greeting}</p>
    <p style="font-size:15px;color:#4b5563;margin:0 0 24px 0;">${aiContent.summary}</p>

    <!-- OVERALL GRADE -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:80px;height:80px;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:50%;line-height:80px;color:white;font-size:36px;font-weight:700;">${overallGrade}</div>
      <p style="margin:12px 0 0 0;color:#6b7280;font-size:14px;">Gesamtnote</p>
    </div>

    <!-- SCORE CARDS -->
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:32px;">
      <div style="flex:1;min-width:140px;background:#f9fafb;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${getScoreColor(scores.performance)};">${scores.performance}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Performance</div>
        <div style="font-size:18px;font-weight:600;color:${getScoreColor(scores.performance)};">${grades.performance}</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f9fafb;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${getScoreColor(scores.seo)};">${scores.seo}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">SEO</div>
        <div style="font-size:18px;font-weight:600;color:${getScoreColor(scores.seo)};">${grades.seo}</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f9fafb;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${getScoreColor(scores.security)};">${scores.security}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Sicherheit</div>
        <div style="font-size:18px;font-weight:600;color:${getScoreColor(scores.security)};">${grades.security}</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f9fafb;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${getScoreColor(scores.accessibility)};">${scores.accessibility}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Barrierefreiheit</div>
        <div style="font-size:18px;font-weight:600;color:${getScoreColor(scores.accessibility)};">${grades.accessibility}</div>
      </div>
    </div>

    <!-- KEY INSIGHTS -->
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:32px;">
      <h3 style="font-size:16px;color:#065f46;margin:0 0 12px 0;">📊 Wichtigste Erkenntnisse</h3>
      <ul style="margin:0;padding-left:20px;color:#047857;font-size:14px;">
        ${insightsHTML}
      </ul>
    </div>

    <!-- PERFORMANCE SECTION -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">⚡ Performance-Analyse</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px 0;">${aiContent.performanceAnalysis}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        <div style="flex:1;min-width:120px;background:#f9fafb;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">LCP</div>
          <div style="font-size:18px;font-weight:600;color:${safeNumber(performance.lcp) <= 2500 ? "#10b981" : safeNumber(performance.lcp) <= 4000 ? "#f59e0b" : "#ef4444"};">${(safeNumber(performance.lcp) / 1000).toFixed(1)}s</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f9fafb;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">FCP</div>
          <div style="font-size:18px;font-weight:600;color:${safeNumber(performance.fcp) <= 1800 ? "#10b981" : safeNumber(performance.fcp) <= 3000 ? "#f59e0b" : "#ef4444"};">${(safeNumber(performance.fcp) / 1000).toFixed(1)}s</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f9fafb;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">CLS</div>
          <div style="font-size:18px;font-weight:600;color:${safeNumber(performance.cls) <= 0.1 ? "#10b981" : safeNumber(performance.cls) <= 0.25 ? "#f59e0b" : "#ef4444"};">${safeNumber(performance.cls).toFixed(3)}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f9fafb;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Mobile</div>
          <div style="font-size:18px;font-weight:600;color:${getScoreColor(performance.mobile as number)};">${performance.mobile}</div>
        </div>
      </div>
    </div>

    <!-- SEO SECTION -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🔍 SEO-Analyse</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px 0;">${aiContent.seoAnalysis}</p>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;font-size:13px;">
        <div style="margin-bottom:8px;"><strong>Title:</strong> ${seoOnPage.title || "Nicht gesetzt"} <span style="color:#6b7280;">(${seoOnPage.titleLength} Zeichen)</span></div>
        <div style="margin-bottom:8px;"><strong>Meta Description:</strong> <span style="color:#6b7280;">${seoOnPage.descriptionLength} Zeichen</span></div>
        <div style="margin-bottom:8px;"><strong>H1:</strong> ${seoOnPage.h1Count} vorhanden | <strong>H2:</strong> ${seoOnPage.h2Count} vorhanden</div>
        <div style="margin-bottom:8px;"><strong>Bilder:</strong> ${images.total} gesamt, ${images.missingAlt} ohne Alt-Text</div>
        <div><strong>Links:</strong> ${(summary.links as { internal: number; external: number; broken: number }).internal} intern, ${(summary.links as { internal: number; external: number; broken: number }).external} extern, ${(summary.links as { internal: number; external: number; broken: number }).broken} kaputt</div>
      </div>
      ${rankingsHTML}
      ${seoAnalysisData ? `
      <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;font-size:13px;">
        <h4 style="margin:0 0 8px 0;font-size:14px;">📊 Domain-Metriken</h4>
        <div style="display:flex;flex-wrap:wrap;gap:16px;">
          <div><strong>Backlinks:</strong> ${(seoAnalysisData.backlinks as number)?.toLocaleString() || 0}</div>
          <div><strong>Referring Domains:</strong> ${(seoAnalysisData.referringDomains as number)?.toLocaleString() || 0}</div>
          <div><strong>Organische Keywords:</strong> ${(seoAnalysisData.organicKeywords as number)?.toLocaleString() || 0}</div>
        </div>
      </div>
      ` : ""}
    </div>

    <!-- TECHNICAL SECTION -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🔧 Technische Details</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;font-size:13px;">
        <span style="background:${technical.isHttps ? "#d1fae5" : "#fee2e2"};color:${technical.isHttps ? "#065f46" : "#991b1b"};padding:4px 10px;border-radius:6px;">${technical.isHttps ? "✓" : "✗"} HTTPS</span>
        <span style="background:${technical.hasViewport ? "#d1fae5" : "#fef3c7"};color:${technical.hasViewport ? "#065f46" : "#92400e"};padding:4px 10px;border-radius:6px;">${technical.hasViewport ? "✓" : "✗"} Mobile-Optimiert</span>
        <span style="background:${technical.hasSitemap ? "#d1fae5" : "#fef3c7"};color:${technical.hasSitemap ? "#065f46" : "#92400e"};padding:4px 10px;border-radius:6px;">${technical.hasSitemap ? "✓" : "✗"} Sitemap</span>
        <span style="background:${technical.hasRobotsTxt ? "#d1fae5" : "#fef3c7"};color:${technical.hasRobotsTxt ? "#065f46" : "#92400e"};padding:4px 10px;border-radius:6px;">${technical.hasRobotsTxt ? "✓" : "✗"} Robots.txt</span>
        ${technical.cms ? `<span style="background:#e0e7ff;color:#3730a3;padding:4px 10px;border-radius:6px;">CMS: ${technical.cms}</span>` : ""}
      </div>
    </div>

    <!-- SECURITY SECTION -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🔒 Sicherheit</h2>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px 0;">${aiContent.securityAnalysis}</p>
      <div style="background:#f9fafb;padding:12px 16px;border-radius:8px;font-size:14px;">
        <strong>Security Score:</strong> <span style="color:${getScoreColor((summary.security as { score: number }).score)};">${(summary.security as { score: number }).score}/100</span>
      </div>
    </div>

    <!-- CONTENT ANALYSIS - NEW -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">📝 Content-Analyse</h2>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div style="flex:1;min-width:140px;background:#f9fafb;padding:16px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:${(summary.content as {wordCount: number}).wordCount >= 300 ? "#10b981" : (summary.content as {wordCount: number}).wordCount >= 150 ? "#f59e0b" : "#ef4444"};">${(summary.content as {wordCount: number}).wordCount}</div>
          <div style="font-size:12px;color:#6b7280;">Wörter</div>
          <div style="font-size:11px;color:${(summary.content as {wordCount: number}).wordCount >= 300 ? "#10b981" : "#f59e0b"};">${(summary.content as {wordCount: number}).wordCount >= 300 ? "✓ Gut" : (summary.content as {wordCount: number}).wordCount >= 150 ? "⚠ Könnte mehr sein" : "✗ Zu wenig"}</div>
        </div>
        <div style="flex:1;min-width:140px;background:#f9fafb;padding:16px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6b7280;">${(summary.content as {readingTime: number}).readingTime}</div>
          <div style="font-size:12px;color:#6b7280;">Min. Lesezeit</div>
        </div>
        <div style="flex:1;min-width:140px;background:#f9fafb;padding:16px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6b7280;">${(summary.pageMetrics as {totalRequests: number}).totalRequests || 0}</div>
          <div style="font-size:12px;color:#6b7280;">HTTP Requests</div>
        </div>
      </div>
      ${(summary.content as {wordCount: number}).wordCount < 300 ? `
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:0 8px 8px 0;font-size:13px;">
        <strong style="color:#92400e;">💡 Tipp:</strong> <span style="color:#78350f;">Google bevorzugt Seiten mit mindestens 300-500 Wörtern. Mehr hochwertiger Content = bessere Rankings!</span>
      </div>
      ` : ""}
    </div>

    <!-- SOCIAL MEDIA & CONTACT - NEW -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">📱 Social Media & Kontakt</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        ${Object.keys(summary.socialMedia as Record<string, string>).length > 0 ?
          Object.entries(summary.socialMedia as Record<string, string>).map(([platform]) => `
            <span style="background:#d1fae5;color:#065f46;padding:6px 12px;border-radius:6px;font-size:13px;">✓ ${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
          `).join("") :
          `<span style="background:#fee2e2;color:#991b1b;padding:6px 12px;border-radius:6px;font-size:13px;">✗ Keine Social Media Links gefunden</span>`
        }
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;font-size:13px;">
        <div style="margin-bottom:8px;">
          <strong>E-Mail auf Website:</strong>
          ${(summary.contact as {emails: string[]}).emails.length > 0 ?
            `<span style="color:#10b981;">✓ ${(summary.contact as {emails: string[]}).emails[0]}</span>` :
            `<span style="color:#ef4444;">✗ Nicht gefunden</span>`}
        </div>
        <div style="margin-bottom:8px;">
          <strong>Telefon auf Website:</strong>
          ${(summary.contact as {phones: string[]}).phones.length > 0 ?
            `<span style="color:#10b981;">✓ Gefunden</span>` :
            `<span style="color:#ef4444;">✗ Nicht gefunden</span>`}
        </div>
        <div>
          <strong>Kontaktformular:</strong>
          ${(summary.contact as {hasContactForm: boolean}).hasContactForm ?
            `<span style="color:#10b981;">✓ Vorhanden</span>` :
            `<span style="color:#f59e0b;">⚠ Nicht gefunden</span>`}
        </div>
      </div>
      ${Object.keys(summary.socialMedia as Record<string, string>).length === 0 ? `
      <div style="margin-top:12px;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:0 8px 8px 0;font-size:13px;">
        <strong style="color:#92400e;">💡 Tipp:</strong> <span style="color:#78350f;">Verlinken Sie Ihre Social Media Profile! Das stärkt Ihre Online-Präsenz und hilft Kunden, Sie zu finden.</span>
      </div>
      ` : ""}
    </div>

    <!-- TRACKING & ANALYTICS - NEW -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">📊 Tracking & Analytics</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <span style="background:${(summary.tracking as {hasGoogleAnalytics: boolean}).hasGoogleAnalytics ? "#d1fae5" : "#fee2e2"};color:${(summary.tracking as {hasGoogleAnalytics: boolean}).hasGoogleAnalytics ? "#065f46" : "#991b1b"};padding:6px 12px;border-radius:6px;font-size:13px;">
          ${(summary.tracking as {hasGoogleAnalytics: boolean}).hasGoogleAnalytics ? "✓" : "✗"} Google Analytics
        </span>
        <span style="background:${(summary.tracking as {hasGoogleTagManager: boolean}).hasGoogleTagManager ? "#d1fae5" : "#f3f4f6"};color:${(summary.tracking as {hasGoogleTagManager: boolean}).hasGoogleTagManager ? "#065f46" : "#6b7280"};padding:6px 12px;border-radius:6px;font-size:13px;">
          ${(summary.tracking as {hasGoogleTagManager: boolean}).hasGoogleTagManager ? "✓" : "○"} Tag Manager
        </span>
        <span style="background:${(summary.tracking as {hasFacebookPixel: boolean}).hasFacebookPixel ? "#d1fae5" : "#f3f4f6"};color:${(summary.tracking as {hasFacebookPixel: boolean}).hasFacebookPixel ? "#065f46" : "#6b7280"};padding:6px 12px;border-radius:6px;font-size:13px;">
          ${(summary.tracking as {hasFacebookPixel: boolean}).hasFacebookPixel ? "✓" : "○"} Facebook Pixel
        </span>
      </div>
      ${!(summary.tracking as {hasGoogleAnalytics: boolean}).hasGoogleAnalytics ? `
      <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:12px;border-radius:0 8px 8px 0;font-size:13px;">
        <strong style="color:#991b1b;">⚠️ Wichtig:</strong> <span style="color:#7f1d1d;">Sie tracken keine Besucher! Ohne Analytics wissen Sie nicht, woher Ihre Kunden kommen und was sie auf Ihrer Website tun.</span>
      </div>
      ` : ""}
    </div>

    <!-- STRUCTURED DATA - NEW -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🏷️ Strukturierte Daten (Schema.org)</h2>
      ${(summary.structuredData as {hasStructuredData: boolean}).hasStructuredData ? `
        <div style="background:#d1fae5;padding:16px;border-radius:8px;font-size:14px;color:#065f46;">
          <strong>✓ Schema.org Daten gefunden:</strong> ${(summary.structuredData as {types: string[]}).types.join(", ")}
        </div>
        <p style="font-size:13px;color:#6b7280;margin:8px 0 0 0;">Strukturierte Daten helfen Google, Ihr Business besser zu verstehen und Rich Snippets in den Suchergebnissen anzuzeigen.</p>
      ` : `
        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:0 8px 8px 0;">
          <strong style="color:#92400e;">✗ Keine strukturierten Daten gefunden</strong>
          <p style="font-size:13px;color:#78350f;margin:8px 0 0 0;">
            Mit Schema.org Markup (z.B. LocalBusiness) kann Google Ihre Öffnungszeiten, Adresse und Bewertungen direkt in den Suchergebnissen anzeigen. Das erhöht die Klickrate erheblich!
          </p>
        </div>
      `}
    </div>

    <!-- TECHNOLOGIES - NEW -->
    ${(summary.technologies as string[]).length > 0 ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🛠️ Erkannte Technologien</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(summary.technologies as string[]).map(tech => `
          <span style="background:#e0e7ff;color:#3730a3;padding:6px 12px;border-radius:6px;font-size:13px;">${tech}</span>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <!-- DESIGN ANALYSIS -->
    ${((summary.design as {colors: string[]; fonts: string[]; hasDarkMode: boolean}).colors.length > 0 || (summary.design as {colors: string[]; fonts: string[]; hasDarkMode: boolean}).fonts.length > 0) ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🎨 Design-Analyse</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <h4 style="font-size:14px;color:#6b7280;margin:0 0 8px 0;">Farbpalette</h4>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${(summary.design as {colors: string[]}).colors.map(color => `
              <div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;padding:4px 10px;border-radius:6px;">
                <div style="width:20px;height:20px;border-radius:4px;background:${color};border:1px solid #d1d5db;"></div>
                <span style="font-size:12px;font-family:monospace;color:#374151;">${color}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div>
          <h4 style="font-size:14px;color:#6b7280;margin:0 0 8px 0;">Schriftarten</h4>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${(summary.design as {fonts: string[]}).fonts.map(font => `
              <span style="background:#fef3c7;color:#92400e;padding:6px 12px;border-radius:6px;font-size:13px;">${font}</span>
            `).join("")}
          </div>
        </div>
      </div>
      ${(summary.design as {hasDarkMode: boolean}).hasDarkMode ? `
        <div style="margin-top:12px;">
          <span style="background:#374151;color:#ffffff;padding:6px 12px;border-radius:6px;font-size:13px;">🌙 Dark Mode unterstützt</span>
        </div>
      ` : ""}
    </div>
    ` : ""}

    <!-- BUSINESS FEATURES -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">💼 Business-Features</h2>
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;">
        <div style="background:${(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking ? "#d1fae5" : "#fee2e2"};padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;">${(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking ? "✅" : "❌"}</div>
          <div style="font-size:12px;color:${(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking ? "#065f46" : "#991b1b"};margin-top:4px;">Online-Buchung</div>
          ${(summary.business as {bookingSystem: string | null}).bookingSystem ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${(summary.business as {bookingSystem: string | null}).bookingSystem}</div>` : ""}
        </div>
        <div style="background:${(summary.business as {hasGoogleMaps: boolean}).hasGoogleMaps ? "#d1fae5" : "#f3f4f6"};padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;">${(summary.business as {hasGoogleMaps: boolean}).hasGoogleMaps ? "✅" : "○"}</div>
          <div style="font-size:12px;color:${(summary.business as {hasGoogleMaps: boolean}).hasGoogleMaps ? "#065f46" : "#6b7280"};margin-top:4px;">Google Maps</div>
        </div>
        <div style="background:${(summary.business as {hasPriceList: boolean}).hasPriceList ? "#d1fae5" : "#f3f4f6"};padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;">${(summary.business as {hasPriceList: boolean}).hasPriceList ? "✅" : "○"}</div>
          <div style="font-size:12px;color:${(summary.business as {hasPriceList: boolean}).hasPriceList ? "#065f46" : "#6b7280"};margin-top:4px;">Preisliste</div>
        </div>
        <div style="background:${(summary.business as {hasImpressum: boolean}).hasImpressum && (summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "#d1fae5" : "#fee2e2"};padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;">${(summary.business as {hasImpressum: boolean}).hasImpressum && (summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "✅" : "⚠️"}</div>
          <div style="font-size:12px;color:${(summary.business as {hasImpressum: boolean}).hasImpressum && (summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "#065f46" : "#92400e"};margin-top:4px;">Rechtliches</div>
        </div>
      </div>
      <div style="margin-top:12px;padding:12px;background:#f9fafb;border-radius:8px;">
        <div style="font-size:13px;color:#374151;">
          <strong>Rechtliche Seiten:</strong>
          <span style="margin-left:8px;color:${(summary.business as {hasImpressum: boolean}).hasImpressum ? "#059669" : "#dc2626"};">${(summary.business as {hasImpressum: boolean}).hasImpressum ? "✓" : "✗"} Impressum</span>
          <span style="margin-left:8px;color:${(summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "#059669" : "#dc2626"};">${(summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "✓" : "✗"} Datenschutz</span>
          <span style="margin-left:8px;color:${(summary.business as {hasAGB: boolean}).hasAGB ? "#059669" : "#6b7280"};">${(summary.business as {hasAGB: boolean}).hasAGB ? "✓" : "○"} AGB</span>
        </div>
      </div>
      ${!(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking ? `
        <div style="margin-top:12px;padding:12px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
          <strong style="color:#92400e;">💡 Tipp:</strong>
          <span style="color:#78350f;font-size:13px;"> Eine Online-Buchungsmöglichkeit kann Ihre Terminanfragen um bis zu 40% steigern!</span>
        </div>
      ` : ""}
    </div>

    <!-- READABILITY SCORE -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">📖 Lesbarkeit</h2>
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
        <div style="text-align:center;background:#f9fafb;padding:16px;border-radius:8px;">
          <div style="font-size:32px;font-weight:700;color:${(summary.readability as {score: number}).score >= 80 ? "#10b981" : (summary.readability as {score: number}).score >= 60 ? "#f59e0b" : "#ef4444"};">${(summary.readability as {score: number}).score}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Lesbarkeits-Score</div>
          <div style="font-size:14px;font-weight:600;color:#374151;margin-top:2px;">${(summary.readability as {level: string}).level}</div>
        </div>
        <div style="text-align:center;background:#f9fafb;padding:16px;border-radius:8px;">
          <div style="font-size:24px;font-weight:700;color:#6b7280;">${(summary.readability as {avgSentenceLength: number}).avgSentenceLength}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Ø Wörter pro Satz</div>
          <div style="font-size:11px;color:${(summary.readability as {avgSentenceLength: number}).avgSentenceLength <= 15 ? "#10b981" : (summary.readability as {avgSentenceLength: number}).avgSentenceLength <= 20 ? "#f59e0b" : "#ef4444"};margin-top:2px;">${(summary.readability as {avgSentenceLength: number}).avgSentenceLength <= 15 ? "✓ Optimal" : (summary.readability as {avgSentenceLength: number}).avgSentenceLength <= 20 ? "⚠ OK" : "✗ Zu lang"}</div>
        </div>
        <div style="text-align:center;background:#f9fafb;padding:16px;border-radius:8px;">
          <div style="font-size:24px;font-weight:700;color:#6b7280;">${(summary.readability as {avgWordLength: number}).avgWordLength}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Ø Buchstaben pro Wort</div>
          <div style="font-size:11px;color:${(summary.readability as {avgWordLength: number}).avgWordLength <= 5 ? "#10b981" : (summary.readability as {avgWordLength: number}).avgWordLength <= 6 ? "#f59e0b" : "#ef4444"};margin-top:2px;">${(summary.readability as {avgWordLength: number}).avgWordLength <= 5 ? "✓ Einfach" : (summary.readability as {avgWordLength: number}).avgWordLength <= 6 ? "⚠ OK" : "✗ Komplex"}</div>
        </div>
      </div>
      ${(summary.readability as {score: number}).score < 70 ? `
        <div style="margin-top:12px;padding:12px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
          <strong style="color:#92400e;">💡 Verbesserungsvorschlag:</strong>
          <span style="color:#78350f;font-size:13px;"> Kürzere Sätze und einfachere Wörter verbessern die Lesbarkeit und halten Besucher länger auf Ihrer Seite.</span>
        </div>
      ` : ""}
    </div>

    <!-- RECOMMENDATIONS -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;color:#1f2937;margin:0 0 16px 0;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">🎯 Empfohlene Maßnahmen</h2>
      ${recommendationsHTML}
    </div>

    <!-- POSITIVES -->
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:32px;">
      <h3 style="font-size:16px;color:#065f46;margin:0 0 12px 0;">✨ Das macht Ihre Website gut</h3>
      <ul style="margin:0;padding-left:20px;font-size:14px;">
        ${positivesHTML}
      </ul>
    </div>

    <!-- WAS BEDEUTET DAS FÜR SIE? -->
    <div style="margin-bottom:32px;background:linear-gradient(135deg,#faf5ff 0%,#fdf2f8 100%);border-radius:16px;padding:24px;border:1px solid #e9d5ff;">
      <h2 style="font-size:20px;color:#7c3aed;margin:0 0 20px 0;display:flex;align-items:center;gap:8px;">
        📋 Was bedeutet das für Sie?
      </h2>

      <div style="font-size:14px;color:#374151;line-height:1.7;">
        <!-- Performance Erklärung -->
        <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e9d5ff;">
          <strong style="color:#7c3aed;">⚡ Ladezeit (Performance ${scores.performance}/100):</strong>
          <p style="margin:8px 0 0 0;">
            ${scores.performance >= 80
              ? "Ihre Website lädt schnell – sehr gut! Besucher können direkt loslegen ohne zu warten."
              : scores.performance >= 50
              ? `Ihre Website lädt in normaler Geschwindigkeit. ${safeNumber(performance.lcp) > 2500 ? `Der erste sichtbare Inhalt erscheint nach ca. ${(safeNumber(performance.lcp) / 1000).toFixed(1)} Sekunden.` : ""}`
              : `Die Ladezeit könnte verbessert werden. ${safeNumber(performance.lcp) > 4000 ? `Aktuell dauert es ca. ${(safeNumber(performance.lcp) / 1000).toFixed(1)} Sekunden bis der Inhalt sichtbar ist.` : ""}`
            }
          </p>
        </div>

        <!-- SEO Erklärung -->
        <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e9d5ff;">
          <strong style="color:#7c3aed;">🔍 Google-Sichtbarkeit (SEO ${scores.seo}/100):</strong>
          <p style="margin:8px 0 0 0;">
            ${scores.seo >= 80
              ? "Die technischen SEO-Grundlagen sind gut umgesetzt. Google kann Ihre Seite gut lesen und indexieren."
              : scores.seo >= 50
              ? "Die SEO-Grundlagen sind vorhanden. Mit einigen Anpassungen könnte die Sichtbarkeit in Google noch verbessert werden."
              : "Bei der Suchmaschinenoptimierung gibt es Verbesserungspotenzial. Einige Anpassungen könnten helfen, besser gefunden zu werden."
            }
          </p>
        </div>

        <!-- Zusammenfassung -->
        <div style="background:#ffffff;border-radius:8px;padding:16px;margin-top:12px;">
          <strong style="color:#1f2937;">📊 Zusammenfassung:</strong>
          <p style="margin:12px 0 0 0;">
            ${scores.performance >= 70 && scores.seo >= 70
              ? "Ihre Website ist technisch gut aufgestellt. Die Grundlagen stimmen und Besucher finden sich zurecht."
              : scores.performance >= 50 || scores.seo >= 50
              ? "Ihre Website funktioniert grundsätzlich. Es gibt einige Bereiche mit Optimierungspotenzial, die bei Interesse verbessert werden könnten."
              : "Ihre Website hat Potenzial. Mit einigen Anpassungen könnte sie noch besser für Sie arbeiten."
            }
            ${(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking
              ? " Die Online-Buchung ist ein großer Pluspunkt!"
              : " Eine Online-Buchung könnte ein hilfreicher Zusatzservice sein."
            }
          </p>
        </div>
      </div>
    </div>

    <!-- MÖGLICHE VERBESSERUNGEN -->
    <div style="margin-bottom:32px;background:#f9fafb;border-radius:16px;padding:24px;border:1px solid #e5e7eb;">
      <h2 style="font-size:18px;color:#374151;margin:0 0 16px 0;">💡 Mögliche Verbesserungen</h2>
      <p style="font-size:14px;color:#6b7280;margin:0 0 16px 0;">Basierend auf der Analyse gibt es folgende Optimierungsmöglichkeiten:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        ${scores.performance < 70 ? "<li>Ladezeit verbessern durch Bildoptimierung und Caching</li>" : ""}
        ${!(summary.business as {hasImpressum: boolean}).hasImpressum || !(summary.business as {hasDatenschutz: boolean}).hasDatenschutz ? "<li>Impressum und Datenschutzerklärung ergänzen</li>" : ""}
        ${!(summary.business as {hasOnlineBooking: boolean}).hasOnlineBooking ? "<li>Online-Terminbuchung als zusätzlicher Service</li>" : ""}
        ${scores.seo < 70 ? "<li>SEO-Grundlagen wie Meta-Beschreibungen optimieren</li>" : ""}
        ${safeNumber((summary.content as {wordCount: number}).wordCount) < 300 ? "<li>Textinhalte auf der Startseite erweitern</li>" : ""}
        <li>Regelmäßig Inhalte aktualisieren</li>
      </ul>
    </div>

    <!-- CONCLUSION -->
    <p style="font-size:15px;color:#4b5563;margin:0;text-align:center;padding:20px 0;border-top:1px solid #e5e7eb;">
      ${aiContent.conclusion}
    </p>

    <!-- CTA BUTTON -->
    <div style="text-align:center;padding:24px 0;margin-top:20px;background:#f9fafb;border-radius:16px;">
      <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">
        Haben Sie Fragen zu den Ergebnissen?<br>
        <span style="font-size:14px;color:#6b7280;">Wir erklären Ihnen gerne alles in einem kurzen Gespräch.</span>
      </p>
      <a href="https://calendly.com/office-arsenio/kosmetikstudio-termin" style="display:inline-block;background:linear-gradient(90deg,#ec4899,#8b5cf6);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:15px;">
        Gespräch vereinbaren
      </a>
      <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">
        Kostenlos & unverbindlich
      </p>
    </div>

  </div>
</div>`;
}

export async function generateAnalysisReport(data: AnalysisData): Promise<string> {
  try {
    // Safely extract scores with defaults
    const scores = {
      performance: data.mobile?.scores?.performance ?? 0,
      seo: data.mobile?.scores?.seo ?? 0,
      security: data.securityHeaders?.score ?? 0,
      accessibility: data.mobile?.scores?.accessibility ?? 0,
    };

    const overallGrade = getOverallGrade(scores);

    const summary = {
      overallGrade,
      grades: {
        performance: getGrade(scores.performance),
        seo: getGrade(scores.seo),
        security: getGrade(scores.security),
        accessibility: getGrade(scores.accessibility),
      },
      scores,
      performance: {
        mobile: data.mobile?.scores?.performance ?? 0,
        desktop: data.desktop?.scores?.performance ?? 0,
        lcp: data.mobile?.coreWebVitals?.lcp ?? 0,
        fcp: data.mobile?.coreWebVitals?.fcp ?? 0,
        cls: data.mobile?.coreWebVitals?.cls ?? 0,
        tbt: data.mobile?.coreWebVitals?.tbt ?? 0,
        speedIndex: data.mobile?.coreWebVitals?.speedIndex ?? 0,
      },
      seoOnPage: {
        title: data.scraped?.meta?.title ?? "Nicht verfügbar",
        titleLength: data.scraped?.meta?.titleLength ?? 0,
        description: data.scraped?.meta?.description?.slice(0, 160) ?? "",
        descriptionLength: data.scraped?.meta?.descriptionLength ?? 0,
        h1: data.scraped?.headings?.h1?.[0] ?? "FEHLT",
        h1Count: data.scraped?.headings?.h1?.length ?? 0,
        h2Count: data.scraped?.headings?.h2?.length ?? 0,
      },
      images: {
        total: data.scraped?.images?.total ?? 0,
        missingAlt: data.scraped?.images?.missingAlt ?? 0,
      },
      links: {
        internal: data.scraped?.links?.internal ?? 0,
        external: data.scraped?.links?.external ?? 0,
        broken: data.brokenLinks?.filter((l) => l.type === "broken")?.length ?? 0,
      },
      technical: {
        isHttps: data.scraped?.security?.isHttps ?? false,
        hasViewport: data.scraped?.technical?.hasViewport ?? false,
        cms: data.scraped?.technical?.detectedCms ?? null,
        hasSitemap: data.robotsSitemap?.hasSitemap ?? false,
        hasRobotsTxt: data.robotsSitemap?.hasRobotsTxt ?? false,
      },
      security: {
        score: data.securityHeaders?.score ?? 0,
        issues: data.securityHeaders?.issues?.slice(0, 3) ?? [],
      },
      seoAnalysis: data.seoAnalysis
        ? {
            domain: data.seoAnalysis.domain ?? "N/A",
            domainRank: data.seoAnalysis.domainMetrics?.domainRank ?? 0,
            organicKeywords: data.seoAnalysis.domainMetrics?.organicKeywords ?? 0,
            backlinks: data.seoAnalysis.backlinks?.totalBacklinks ?? 0,
            referringDomains: data.seoAnalysis.backlinks?.referringDomains ?? 0,
            rankings: (data.seoAnalysis.rankings ?? []).slice(0, 10).map((r) => ({
              keyword: r.keyword ?? "",
              position: r.position,
              searchVolume: r.searchVolume ?? 0,
            })),
          }
        : null,
      extractedKeywords: data.extractedKeywords?.slice(0, 5) ?? [],
      // NEW: Additional data for extended report
      screenshot: data.mobile?.screenshot ?? null,
      content: {
        wordCount: data.scraped?.content?.wordCount ?? 0,
        readingTime: data.scraped?.content?.readingTime ?? 0,
      },
      socialMedia: data.scraped?.contact?.socialLinks ?? {},
      contact: {
        emails: data.scraped?.contact?.emails ?? [],
        phones: data.scraped?.contact?.phones ?? [],
        hasContactForm: data.scraped?.contact?.hasContactForm ?? false,
      },
      tracking: {
        hasGoogleAnalytics: data.scraped?.technical?.hasGoogleAnalytics ?? false,
        hasGoogleTagManager: data.scraped?.technical?.hasGoogleTagManager ?? false,
        hasFacebookPixel: data.scraped?.technical?.hasFacebookPixel ?? false,
        hasHotjar: data.scraped?.technical?.hasHotjar ?? false,
      },
      structuredData: {
        hasStructuredData: data.scraped?.technical?.hasStructuredData ?? false,
        types: data.scraped?.technical?.structuredDataTypes ?? [],
      },
      openGraph: data.scraped?.meta?.ogTags ?? {},
      technologies: data.scraped?.technical?.detectedTechnologies ?? [],
      accessibilityDetails: {
        score: data.mobile?.scores?.accessibility ?? 0,
        hasSkipLink: data.scraped?.accessibility?.hasSkipLink ?? false,
        hasMainLandmark: data.scraped?.accessibility?.hasMainLandmark ?? false,
        hasAriaLabels: data.scraped?.accessibility?.hasAriaLabels ?? false,
        formsWithoutLabels: data.scraped?.accessibility?.formsWithoutLabels ?? 0,
      },
      pageMetrics: {
        totalSize: data.mobile?.pageMetrics?.totalSize ?? "N/A",
        totalRequests: data.mobile?.pageMetrics?.totalRequests ?? 0,
      },
      // NEW: Design Analysis
      design: {
        colors: data.scraped?.design?.colors ?? [],
        fonts: data.scraped?.design?.fonts ?? [],
        hasDarkMode: data.scraped?.design?.hasDarkMode ?? false,
      },
      // NEW: Business Features
      business: {
        hasOnlineBooking: data.scraped?.business?.hasOnlineBooking ?? false,
        bookingSystem: data.scraped?.business?.bookingSystem ?? null,
        hasGoogleMaps: data.scraped?.business?.hasGoogleMaps ?? false,
        hasPriceList: data.scraped?.business?.hasPriceList ?? false,
        hasImpressum: data.scraped?.business?.hasImpressum ?? false,
        hasDatenschutz: data.scraped?.business?.hasDatenschutz ?? false,
        hasAGB: data.scraped?.business?.hasAGB ?? false,
      },
      // NEW: Readability Score
      readability: {
        avgSentenceLength: data.scraped?.readability?.avgSentenceLength ?? 0,
        avgWordLength: data.scraped?.readability?.avgWordLength ?? 0,
        score: data.scraped?.readability?.score ?? 0,
        level: data.scraped?.readability?.level ?? "N/A",
      },
    };

    console.log("=== REPORT DEBUG ===");
    console.log("Website URL:", data.websiteUrl);
    console.log("Client Name:", data.clientName);
    console.log("Summary scores:", JSON.stringify(summary.scores));
    console.log("SEO Title:", summary.seoOnPage.title);
    console.log("SEO Analysis Domain:", summary.seoAnalysis?.domain);
    console.log("Rankings:", JSON.stringify(summary.seoAnalysis?.rankings?.slice(0, 3)));
    console.log("Extracted Keywords:", summary.extractedKeywords);
    console.log("===================");
    const aiContent = await generateAIContent(data, summary);
    console.log("AI content generated successfully, building HTML...");

    const html = buildHTMLReport(data, aiContent, summary);
    console.log("HTML report built, length:", html.length);
    return html;
  } catch (error) {
    console.error("CRITICAL Error in generateAnalysisReport:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");

    // Create fallback scores safely
    const fallbackScores = {
      performance: data.mobile?.scores?.performance ?? 0,
      seo: data.mobile?.scores?.seo ?? 0,
      security: data.securityHeaders?.score ?? 0,
      accessibility: data.mobile?.scores?.accessibility ?? 0,
    };

    // Create complete fallback summary
    const fallbackSummary = {
      overallGrade: getOverallGrade(fallbackScores),
      grades: {
        performance: getGrade(fallbackScores.performance),
        seo: getGrade(fallbackScores.seo),
        security: getGrade(fallbackScores.security),
        accessibility: getGrade(fallbackScores.accessibility),
      },
      scores: fallbackScores,
      performance: {
        mobile: data.mobile?.scores?.performance ?? 0,
        desktop: data.desktop?.scores?.performance ?? 0,
        lcp: data.mobile?.coreWebVitals?.lcp ?? 0,
        fcp: data.mobile?.coreWebVitals?.fcp ?? 0,
        cls: data.mobile?.coreWebVitals?.cls ?? 0,
        tbt: data.mobile?.coreWebVitals?.tbt ?? 0,
        speedIndex: data.mobile?.coreWebVitals?.speedIndex ?? 0,
      },
      seoOnPage: {
        title: data.scraped?.meta?.title ?? "Nicht verfügbar",
        titleLength: data.scraped?.meta?.titleLength ?? 0,
        description: data.scraped?.meta?.description?.slice(0, 160) ?? "",
        descriptionLength: data.scraped?.meta?.descriptionLength ?? 0,
        h1: data.scraped?.headings?.h1?.[0] ?? "FEHLT",
        h1Count: data.scraped?.headings?.h1?.length ?? 0,
        h2Count: data.scraped?.headings?.h2?.length ?? 0,
      },
      images: {
        total: data.scraped?.images?.total ?? 0,
        missingAlt: data.scraped?.images?.missingAlt ?? 0,
      },
      links: {
        internal: data.scraped?.links?.internal ?? 0,
        external: data.scraped?.links?.external ?? 0,
        broken: data.brokenLinks?.filter((l) => l.type === "broken")?.length ?? 0,
      },
      technical: {
        isHttps: data.scraped?.security?.isHttps ?? false,
        hasViewport: data.scraped?.technical?.hasViewport ?? false,
        cms: data.scraped?.technical?.detectedCms ?? null,
        hasSitemap: data.robotsSitemap?.hasSitemap ?? false,
        hasRobotsTxt: data.robotsSitemap?.hasRobotsTxt ?? false,
      },
      security: {
        score: data.securityHeaders?.score ?? 0,
        issues: data.securityHeaders?.issues?.slice(0, 3) ?? [],
      },
      seoAnalysis: data.seoAnalysis
        ? {
            domain: data.seoAnalysis.domain ?? "N/A",
            domainRank: data.seoAnalysis.domainMetrics?.domainRank ?? 0,
            organicKeywords: data.seoAnalysis.domainMetrics?.organicKeywords ?? 0,
            backlinks: data.seoAnalysis.backlinks?.totalBacklinks ?? 0,
            referringDomains: data.seoAnalysis.backlinks?.referringDomains ?? 0,
            rankings: (data.seoAnalysis.rankings ?? []).slice(0, 10).map((r) => ({
              keyword: r.keyword ?? "",
              position: r.position,
              searchVolume: r.searchVolume ?? 0,
            })),
          }
        : null,
      extractedKeywords: data.extractedKeywords?.slice(0, 5) ?? [],
    };

    // FALLBACK: Build report WITHOUT AI - just show all the data directly
    const fallbackAIContent: AIContent = {
      greeting: `Hallo ${data.clientName}!`,
      summary: `Ihre Website ${data.websiteUrl} wurde umfassend analysiert. Hier sind die Ergebnisse.`,
      keyInsights: [
        `Performance-Score: ${fallbackScores.performance}/100`,
        `SEO-Score: ${fallbackScores.seo}/100`,
        `Sicherheits-Score: ${fallbackScores.security}/100`,
        `${data.scraped?.images?.missingAlt ?? 0} Bilder ohne Alt-Text`,
      ],
      performanceAnalysis: `Die Ladezeit wurde gemessen: LCP ${(Number(data.mobile?.coreWebVitals?.lcp ?? 0) / 1000).toFixed(1)}s, FCP ${(Number(data.mobile?.coreWebVitals?.fcp ?? 0) / 1000).toFixed(1)}s. Mobile Score: ${fallbackScores.performance}, Desktop: ${data.desktop?.scores?.performance ?? 0}.`,
      seoAnalysis: `Title: "${data.scraped?.meta?.title ?? 'Nicht gesetzt'}" (${data.scraped?.meta?.titleLength ?? 0} Zeichen). ${data.scraped?.headings?.h1?.length ?? 0} H1-Tag(s) gefunden. Meta-Description: ${data.scraped?.meta?.descriptionLength ?? 0} Zeichen.`,
      securityAnalysis: `${data.scraped?.security?.isHttps ? 'HTTPS ist aktiv.' : 'HTTPS fehlt!'} Sicherheits-Score: ${fallbackScores.security}/100.`,
      recommendations: [
        {
          priority: fallbackScores.performance < 50 ? "kritisch" : "hoch",
          title: "Performance verbessern",
          description: "Bilder optimieren, Caching aktivieren, Code minimieren.",
          impact: "Bessere Nutzererfahrung und Google-Rankings"
        },
        {
          priority: (data.scraped?.images?.missingAlt ?? 0) > 3 ? "hoch" : "mittel",
          title: "Alt-Texte für Bilder",
          description: `${data.scraped?.images?.missingAlt ?? 0} von ${data.scraped?.images?.total ?? 0} Bildern haben keinen Alt-Text.`,
          impact: "Bessere SEO und Barrierefreiheit"
        },
        {
          priority: !data.scraped?.security?.isHttps ? "kritisch" : "mittel",
          title: data.scraped?.security?.isHttps ? "Sicherheit optimieren" : "HTTPS aktivieren",
          description: data.scraped?.security?.isHttps ? "Security Headers überprüfen." : "SSL-Zertifikat einrichten.",
          impact: "Vertrauen und Sicherheit"
        }
      ],
      positives: [
        fallbackScores.seo >= 80 ? "Guter SEO-Score" : "Website ist erreichbar",
        data.scraped?.technical?.hasViewport ? "Mobile-optimiert" : "Grundstruktur vorhanden",
      ],
      conclusion: "Für eine detaillierte Besprechung stehen wir Ihnen gerne zur Verfügung."
    };

    // Build report with fallback content but FULL data
    return buildHTMLReport(data, fallbackAIContent, fallbackSummary);
  }
}
