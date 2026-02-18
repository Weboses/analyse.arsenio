// DataForSEO API Integration
// Dokumentation: https://docs.dataforseo.com/

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || "";
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || "";

function getAuthHeader(): string {
  return "Basic " + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");
}

async function apiRequest<T>(endpoint: string, data: unknown[]): Promise<T> {
  const response = await fetch(`https://api.dataforseo.com/v3${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(60000), // 60s timeout
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DataForSEO API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================
// TYPES
// ============================================

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  trend: number[];
}

export interface RankingResult {
  keyword: string;
  position: number | null;
  url: string | null;
  title: string | null;
  searchVolume: number;
}

export interface BacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  domainRank: number;
  topBacklinks: Array<{
    url: string;
    anchor: string;
    domainRank: number;
    isDofollow: boolean;
  }>;
}

export interface DomainMetrics {
  domainRank: number;
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  referringDomains: number;
}

export interface OnPageResult {
  crawlProgress: string;
  pagesCount: number;
  pagesCrawled: number;
  issues: {
    critical: number;
    warnings: number;
    notices: number;
  };
  checks: {
    // Meta
    titleMissing: number;
    titleTooLong: number;
    titleTooShort: number;
    titleDuplicate: number;
    descriptionMissing: number;
    descriptionTooLong: number;
    descriptionTooShort: number;
    descriptionDuplicate: number;
    // Headings
    h1Missing: number;
    h1Multiple: number;
    h1TooLong: number;
    // Images
    imagesMissingAlt: number;
    imagesBroken: number;
    // Links
    linksBroken: number;
    linksExternal: number;
    linksInternal: number;
    // Technical
    httpLinks: number;
    canonicalMissing: number;
    robotsBlocked: number;
    sitemapMissing: boolean;
    // Performance
    largePages: number;
    slowPages: number;
  };
  topIssues: Array<{
    type: string;
    severity: "critical" | "warning" | "notice";
    count: number;
    description: string;
  }>;
}

export interface ComprehensiveAnalysis {
  domain: string;
  analyzedAt: string;
  domainMetrics: DomainMetrics;
  keywords: KeywordData[];
  rankings: RankingResult[];
  backlinks: BacklinkData;
  onPage: OnPageResult | null;
  competitors: Array<{
    domain: string;
    metrics: DomainMetrics;
  }>;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Keyword-Daten abrufen (Suchvolumen, CPC, Competition)
 */
export async function getKeywordData(keywords: string[], location: string = "Austria"): Promise<KeywordData[]> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Keyword-Analyse");
    return [];
  }

  try {
    const locationCode = location === "Austria" ? 2040 : location === "Germany" ? 2276 : 2040;

    const response = await apiRequest<{tasks: Array<{result: Array<{items: unknown[]}>}>}>("/keywords_data/google_ads/search_volume/live", [{
      keywords,
      location_code: locationCode,
      language_code: "de",
    }]);

    const items = response.tasks?.[0]?.result?.[0]?.items || [];

    return items.map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      competitionLevel: item.competition_level || "unknown",
      trend: item.monthly_searches?.map((m: any) => m.search_volume) || [],
    }));
  } catch (error) {
    console.error("Keyword Data Error:", error);
    return [];
  }
}

/**
 * Google Rankings für Keywords checken
 */
export async function checkKeywordRankings(
  domain: string,
  keywords: string[],
  location: string = "Austria"
): Promise<RankingResult[]> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Ranking-Check");
    return [];
  }

  try {
    const locationCode = location === "Austria" ? 2040 : location === "Germany" ? 2276 : 2040;
    const results: RankingResult[] = [];

    // Batch keywords (max 100 per request)
    for (const keyword of keywords.slice(0, 10)) {
      const response = await apiRequest<{tasks: Array<{result: Array<{items: unknown[]}>}>}>("/serp/google/organic/live/regular", [{
        keyword,
        location_code: locationCode,
        language_code: "de",
        depth: 100, // Top 100 results
      }]);

      const items = response.tasks?.[0]?.result?.[0]?.items || [];
      const domainClean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

      // Find our domain in results
      const found = items.find((item: any) => {
        const itemDomain = (item.domain || "").replace(/^www\./, "");
        return itemDomain.includes(domainClean) || domainClean.includes(itemDomain);
      }) as any;

      results.push({
        keyword,
        position: found?.rank_absolute || null,
        url: found?.url || null,
        title: found?.title || null,
        searchVolume: 0, // Will be enriched later
      });

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    return results;
  } catch (error) {
    console.error("Ranking Check Error:", error);
    return [];
  }
}

/**
 * Backlink-Profil abrufen
 */
export async function getBacklinkProfile(domain: string): Promise<BacklinkData> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Backlink-Analyse");
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      domainRank: 0,
      topBacklinks: [],
    };
  }

  try {
    // Get summary
    const summaryResponse = await apiRequest<{tasks: Array<{result: Array<any>}>}>("/backlinks/summary/live", [{
      target: domain,
      include_subdomains: true,
    }]);

    const summary = summaryResponse.tasks?.[0]?.result?.[0] || {};

    // Get top backlinks
    const backlinksResponse = await apiRequest<{tasks: Array<{result: Array<{items: unknown[]}>}>}>("/backlinks/backlinks/live", [{
      target: domain,
      include_subdomains: true,
      limit: 20,
      order_by: ["rank,desc"],
      filters: ["dofollow", "=", true],
    }]);

    const backlinks = backlinksResponse.tasks?.[0]?.result?.[0]?.items || [];

    return {
      totalBacklinks: summary.backlinks || 0,
      referringDomains: summary.referring_domains || 0,
      domainRank: summary.rank || 0,
      topBacklinks: backlinks.slice(0, 10).map((bl: any) => ({
        url: bl.url_from || "",
        anchor: bl.anchor || "",
        domainRank: bl.domain_from_rank || 0,
        isDofollow: bl.dofollow || false,
      })),
    };
  } catch (error) {
    console.error("Backlinks Error:", error);
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      domainRank: 0,
      topBacklinks: [],
    };
  }
}

/**
 * Domain-Metriken abrufen
 */
export async function getDomainMetrics(domain: string): Promise<DomainMetrics> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Domain-Metriken");
    return {
      domainRank: 0,
      organicTraffic: 0,
      organicKeywords: 0,
      backlinks: 0,
      referringDomains: 0,
    };
  }

  try {
    const response = await apiRequest<{tasks: Array<{result: Array<any>}>}>("/dataforseo_labs/google/domain_metrics_by_categories/live", [{
      target: domain,
      location_code: 2040, // Austria
      language_code: "de",
    }]);

    const result = response.tasks?.[0]?.result?.[0] || {};
    const metrics = result.metrics?.organic || {};

    return {
      domainRank: metrics.pos_1 || 0,
      organicTraffic: metrics.etv || 0,
      organicKeywords: metrics.count || 0,
      backlinks: 0, // From backlinks API
      referringDomains: 0, // From backlinks API
    };
  } catch (error) {
    console.error("Domain Metrics Error:", error);
    return {
      domainRank: 0,
      organicTraffic: 0,
      organicKeywords: 0,
      backlinks: 0,
      referringDomains: 0,
    };
  }
}

/**
 * Ranked Keywords für eine Domain abrufen
 */
export async function getRankedKeywords(domain: string, limit: number = 20): Promise<RankingResult[]> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Ranked Keywords");
    return [];
  }

  console.log(`[DataForSEO getRankedKeywords] ===========================`);
  console.log(`[DataForSEO getRankedKeywords] Input domain: "${domain}"`);
  console.log(`[DataForSEO getRankedKeywords] Limit: ${limit}`);

  try {
    const requestBody = [{
      target: domain,
      location_code: 2040, // Austria
      language_code: "de",
      limit,
      order_by: ["keyword_data.keyword_info.search_volume,desc"],
      filters: [
        ["ranked_serp_element.serp_item.rank_absolute", "<=", 100]
      ],
    }];

    console.log(`[DataForSEO getRankedKeywords] Request body:`, JSON.stringify(requestBody));

    const response = await apiRequest<{tasks: Array<{result: Array<{items: unknown[]; target?: string; se_domain?: string}>}>}>("/dataforseo_labs/google/ranked_keywords/live", requestBody);

    const result = response.tasks?.[0]?.result?.[0];
    const items = result?.items || [];

    // Log the target that DataForSEO actually used
    console.log(`[DataForSEO getRankedKeywords] Response target domain: "${result?.target || 'N/A'}"`);
    console.log(`[DataForSEO getRankedKeywords] Response se_domain: "${result?.se_domain || 'N/A'}"`);
    console.log(`[DataForSEO getRankedKeywords] Response items count: ${items.length}`);
    console.log(`[DataForSEO getRankedKeywords] First 3 raw items:`, JSON.stringify(items.slice(0, 3), null, 2));

    const results = items.map((item: any) => ({
      keyword: item.keyword_data?.keyword || "",
      position: item.ranked_serp_element?.serp_item?.rank_absolute || null,
      url: item.ranked_serp_element?.serp_item?.url || null,
      title: item.ranked_serp_element?.serp_item?.title || null,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
    }));

    console.log(`[DataForSEO getRankedKeywords] Parsed results:`, JSON.stringify(results.slice(0, 5)));
    console.log(`[DataForSEO getRankedKeywords] ===========================`);

    return results;
  } catch (error) {
    console.error("Ranked Keywords Error:", error);
    return [];
  }
}

/**
 * Konkurrenten finden
 */
export async function findCompetitors(domain: string, limit: number = 5): Promise<Array<{domain: string; metrics: DomainMetrics}>> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("DataForSEO nicht konfiguriert - überspringe Konkurrenz-Analyse");
    return [];
  }

  try {
    const response = await apiRequest<{tasks: Array<{result: Array<{items: unknown[]}>}>}>("/dataforseo_labs/google/competitors_domain/live", [{
      target: domain,
      location_code: 2040, // Austria
      language_code: "de",
      limit,
      filters: [
        ["avg_position", "<", 50]
      ],
    }]);

    const items = response.tasks?.[0]?.result?.[0]?.items || [];

    return items.slice(0, 3).map((item: any) => ({
      domain: item.domain || "",
      metrics: {
        domainRank: item.avg_position || 0,
        organicTraffic: item.metrics?.organic?.etv || 0,
        organicKeywords: item.metrics?.organic?.count || 0,
        backlinks: 0,
        referringDomains: 0,
      },
    }));
  } catch (error) {
    console.error("Competitors Error:", error);
    return [];
  }
}

/**
 * Keywords von einer Seite extrahieren (aus dem Scraping)
 */
export function extractKeywordsFromContent(
  title: string,
  description: string,
  headings: string[],
  content: string
): string[] {
  const allText = `${title} ${description} ${headings.join(" ")} ${content}`.toLowerCase();

  // Common German stop words
  const stopWords = new Set([
    "und", "der", "die", "das", "in", "zu", "den", "ist", "von", "für", "mit",
    "auf", "des", "eine", "ein", "im", "dem", "nicht", "sich", "als", "auch",
    "es", "an", "er", "so", "aus", "bei", "wird", "sie", "nach", "werden",
    "hat", "sind", "oder", "einer", "haben", "diese", "einem", "kann", "noch",
    "wie", "ihr", "ihre", "ihren", "ihrer", "über", "zum", "zur", "uns", "wir",
    "ich", "du", "mich", "dich", "uns", "euch", "wenn", "was", "nur", "mehr",
    "aber", "hier", "alle", "ohne", "denn", "dann", "sehr", "schon", "mal",
    "ganz", "ja", "nein", "immer", "wieder", "heute", "jetzt", "neue", "neuen"
  ]);

  // Extract words (2+ chars, no numbers)
  const words = allText
    .replace(/[^\wäöüß\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  // Count frequency
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Get top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Branchenspezifische Keywords für Kosmetikstudios
 */
export function getIndustryKeywords(location?: string): string[] {
  const baseKeywords = [
    "kosmetikstudio",
    "kosmetikerin",
    "gesichtsbehandlung",
    "hautpflege",
    "anti aging",
    "faltenbehandlung",
    "microneedling",
    "permanent makeup",
    "wimpernverlängerung",
    "maniküre pediküre",
    "wellness massage",
    "beauty salon",
    "hautanalyse",
    "aknebehandlung",
    "lifting",
  ];

  if (location) {
    return [
      ...baseKeywords.map(k => `${k} ${location}`),
      ...baseKeywords,
    ];
  }

  return baseKeywords;
}

/**
 * Komplette Analyse durchführen
 */
export async function runComprehensiveAnalysis(
  url: string,
  scrapedKeywords: string[] = []
): Promise<ComprehensiveAnalysis> {
  const domain = new URL(url).hostname.replace(/^www\./, "");

  console.log(`[DataForSEO] =================================`);
  console.log(`[DataForSEO] URL received: ${url}`);
  console.log(`[DataForSEO] Domain extracted: ${domain}`);
  console.log(`[DataForSEO] Scraped keywords: ${scrapedKeywords.join(", ")}`);
  console.log(`[DataForSEO] =================================`);

  // Extract location from domain (simple heuristic)
  const location = domain.endsWith(".at") ? "Austria" : domain.endsWith(".de") ? "Germany" : "Austria";

  // Combine scraped keywords with industry keywords
  const keywordsToCheck = [
    ...new Set([
      ...scrapedKeywords.slice(0, 5),
      ...getIndustryKeywords().slice(0, 5),
    ])
  ].slice(0, 10);

  console.log(`[DataForSEO] Keywords to analyze: ${keywordsToCheck.join(", ")}`);

  // Run analyses in parallel where possible
  const [
    rankedKeywords,
    backlinks,
    competitors,
    keywordData,
  ] = await Promise.all([
    getRankedKeywords(domain, 20),
    getBacklinkProfile(domain),
    findCompetitors(domain, 5),
    getKeywordData(keywordsToCheck, location),
  ]);

  // Enrich rankings with search volume
  const enrichedRankings = rankedKeywords.map(r => {
    const kd = keywordData.find(k => k.keyword.toLowerCase() === r.keyword.toLowerCase());
    return { ...r, searchVolume: kd?.searchVolume || r.searchVolume };
  });

  console.log(`[DataForSEO] Analysis complete for domain: ${domain}`);
  console.log(`[DataForSEO] Ranked keywords found: ${rankedKeywords.length}`);
  console.log(`[DataForSEO] Top 3 rankings:`, enrichedRankings.slice(0, 3).map(r => `${r.keyword}: #${r.position}`));

  return {
    domain,
    analyzedAt: new Date().toISOString(),
    domainMetrics: {
      domainRank: backlinks.domainRank,
      organicTraffic: 0, // Would need additional API call
      organicKeywords: rankedKeywords.length,
      backlinks: backlinks.totalBacklinks,
      referringDomains: backlinks.referringDomains,
    },
    keywords: keywordData,
    rankings: enrichedRankings,
    backlinks,
    onPage: null, // On-Page API requires separate task creation
    competitors,
  };
}

/**
 * Check if DataForSEO is configured
 */
export function isDataForSEOConfigured(): boolean {
  return !!(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD);
}
