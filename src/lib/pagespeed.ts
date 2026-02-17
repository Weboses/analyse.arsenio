// PageSpeed Insights API Integration
// Mit Retry-Logik und besserem Error Handling

export interface PageSpeedResult {
  type: "mobile" | "desktop";
  url: string;
  fetchTime: string;
  overallGrade: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  coreWebVitals: {
    lcp: string;
    fcp: string;
    cls: string;
    tbt: string;
    speedIndex: string;
  };
  pageMetrics: {
    totalSize: string;
    totalRequests: number;
    timeToInteractive: string;
  };
  opportunities: {
    reduceUnusedJs: string;
    reduceUnusedCss: string;
    serveModernImages: string;
    textCompression: string;
  };
  seoFindings: {
    metaDescription: string;
    robotsTxt: string;
    linkText: string;
  };
  bestPracticesIssues: string[];
  screenshot?: string;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function safeGet<T>(fn: () => T, fallback: T): T {
  try {
    const result = fn();
    return result !== undefined && result !== null ? result : fallback;
  } catch {
    return fallback;
  }
}

// Sleep function for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export async function runPageSpeedAnalysis(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<PageSpeedResult> {
  return withRetry(async () => {
    const apiKey = process.env.PAGESPEED_API_KEY || "";
    const apiUrl = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    );

    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("strategy", strategy);
    // Categories must be added separately, not comma-separated
    for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
      apiUrl.searchParams.append("category", category);
    }

    if (apiKey) {
      apiUrl.searchParams.set("key", apiKey);
    }

    console.log(`Running PageSpeed analysis for ${url} (${strategy})...`);

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (response.status === 429) {
      throw new Error(
        "PageSpeed API rate limit erreicht. Bitte versuchen Sie es in einer Minute erneut."
      );
    }

    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(
        `Ungültige URL: ${errorData.error?.message || "Die Website konnte nicht analysiert werden."}`
      );
    }

    if (!response.ok) {
      throw new Error(`PageSpeed API Fehler: ${response.status}`);
    }

    const data = await response.json();
    const result = data.lighthouseResult || {};
    const audits = result.audits || {};
    const categories = result.categories || {};

    const performanceScore = Math.round(
      (categories.performance?.score || 0) * 100
    );

    // Screenshot extrahieren
    const screenshot = safeGet(
      () => audits["final-screenshot"]?.details?.data,
      undefined
    );

    console.log(
      `PageSpeed ${strategy} complete: Performance ${performanceScore}`
    );

    return {
      type: strategy,
      url: result.finalDisplayedUrl || url,
      fetchTime: result.fetchTime || new Date().toISOString(),
      overallGrade: getGrade(performanceScore),
      scores: {
        performance: performanceScore,
        seo: safeGet(() => Math.round(categories.seo.score * 100), 0),
        accessibility: safeGet(
          () => Math.round(categories.accessibility.score * 100),
          0
        ),
        bestPractices: safeGet(
          () => Math.round(categories["best-practices"].score * 100),
          0
        ),
      },
      coreWebVitals: {
        lcp: safeGet(
          () => audits["largest-contentful-paint"].displayValue,
          "N/A"
        ),
        fcp: safeGet(
          () => audits["first-contentful-paint"].displayValue,
          "N/A"
        ),
        cls: safeGet(
          () => audits["cumulative-layout-shift"].displayValue,
          "N/A"
        ),
        tbt: safeGet(() => audits["total-blocking-time"].displayValue, "N/A"),
        speedIndex: safeGet(() => audits["speed-index"].displayValue, "N/A"),
      },
      pageMetrics: {
        totalSize: safeGet(
          () => audits["total-byte-weight"].displayValue,
          "N/A"
        ),
        totalRequests: safeGet(
          () => audits["network-requests"].details.items.length,
          0
        ),
        timeToInteractive: safeGet(
          () => audits["interactive"].displayValue,
          "N/A"
        ),
      },
      opportunities: {
        reduceUnusedJs: safeGet(
          () => audits["unused-javascript"].displayValue,
          "Keine Einsparung"
        ),
        reduceUnusedCss: safeGet(
          () => audits["unused-css-rules"].displayValue,
          "Keine Einsparung"
        ),
        serveModernImages: safeGet(
          () => audits["modern-image-formats"].displayValue,
          "Keine Einsparung"
        ),
        textCompression: safeGet(
          () => audits["uses-text-compression"].displayValue,
          "Keine Einsparung"
        ),
      },
      seoFindings: {
        metaDescription: safeGet(
          () =>
            audits["meta-description"].score === 1 ? "Vorhanden" : "Fehlt",
          "Unbekannt"
        ),
        robotsTxt: safeGet(
          () => (audits["robots-txt"].score === 1 ? "Vorhanden" : "Fehlt"),
          "Unbekannt"
        ),
        linkText: safeGet(
          () =>
            audits["link-text"].score === 1
              ? "Gut lesbar"
              : "Verbesserungswürdig",
          "Unbekannt"
        ),
      },
      bestPracticesIssues: [
        url.startsWith("https://") ? "HTTPS aktiv" : "Kein HTTPS",
        safeGet(
          () =>
            audits["no-vulnerable-libraries"]?.score === 1
              ? "Keine bekannten Sicherheitslücken"
              : "Sicherheitslücken gefunden",
          "Unbekannt"
        ),
      ],
      screenshot,
    };
  }, 3, 2000); // 3 Versuche, 2 Sekunden Basis-Delay
}

export async function runFullPageSpeedAnalysis(url: string) {
  console.log(`Starting full PageSpeed analysis for ${url}`);

  // Mobile ist wichtiger - wenn das fehlschlägt, abbrechen
  const mobile = await runPageSpeedAnalysis(url, "mobile");

  // Small delay between requests
  await sleep(1000);

  // Desktop ist optional - wenn es fehlschlägt, Mobile-Daten verwenden
  let desktop: PageSpeedResult;
  try {
    desktop = await runPageSpeedAnalysis(url, "desktop");
  } catch (error) {
    console.log(`Desktop PageSpeed failed, using mobile data as fallback: ${error}`);
    // Kopiere Mobile-Daten als Desktop-Fallback
    desktop = {
      ...mobile,
      type: "desktop",
    };
  }

  return { mobile, desktop };
}
