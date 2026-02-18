import * as cheerio from "cheerio";

export interface ScrapedData {
  meta: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    canonical: string;
    robots: string;
    ogTags: Record<string, string>;
    twitterTags: Record<string, string>;
    lang: string;
    keywords: string;
    author: string;
    generator: string;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  images: {
    total: number;
    missingAlt: number;
    lazyLoaded: number;
    withDimensions: number;
    images: Array<{ src: string; alt: string | null; lazy: boolean }>;
  };
  links: {
    internal: number;
    external: number;
    total: number;
    nofollow: number;
    emptyAnchors: number;
    allLinks: Array<{ href: string; text: string; isExternal: boolean }>;
  };
  content: {
    wordCount: number;
    textContent: string;
    readingTime: number;
  };
  technical: {
    hasViewport: boolean;
    hasFavicon: boolean;
    hasStructuredData: boolean;
    structuredDataTypes: string[];
    detectedCms: string | null;
    detectedTechnologies: string[];
    hasGoogleAnalytics: boolean;
    hasGoogleTagManager: boolean;
    hasFacebookPixel: boolean;
    hasHotjar: boolean;
    inlineCss: boolean;
    inlineJs: boolean;
    hasServiceWorker: boolean;
    hasManifest: boolean;
  };
  contact: {
    emails: string[];
    phones: string[];
    addresses: string[];
    hasContactForm: boolean;
    socialLinks: Record<string, string>;
  };
  security: {
    isHttps: boolean;
    hasMixedContent: boolean;
    externalScripts: string[];
  };
  accessibility: {
    hasSkipLink: boolean;
    hasMainLandmark: boolean;
    hasNavLandmark: boolean;
    formsWithLabels: number;
    formsWithoutLabels: number;
    hasAriaLabels: boolean;
    tabindexIssues: number;
    contrastIssuesHint: boolean;
  };
  performance: {
    totalScripts: number;
    externalScripts: number;
    totalStylesheets: number;
    externalStylesheets: number;
    hasAsyncScripts: boolean;
    hasDeferScripts: boolean;
    hasPreconnect: boolean;
    hasPreload: boolean;
    hasDnsPrefetch: boolean;
    estimatedDomSize: number;
    iframeCount: number;
  };
  // NEW: Design Analysis
  design: {
    colors: string[];
    fonts: string[];
    hasDarkMode: boolean;
  };
  // NEW: Business Features
  business: {
    hasOnlineBooking: boolean;
    bookingSystem: string | null;
    hasGoogleMaps: boolean;
    hasPriceList: boolean;
    hasImpressum: boolean;
    hasDatenschutz: boolean;
    hasAGB: boolean;
  };
  // NEW: Content Quality
  readability: {
    avgSentenceLength: number;
    avgWordLength: number;
    score: number; // 0-100, higher is easier to read
    level: string; // "Einfach", "Mittel", "Komplex"
  };
}

export interface RobotsSitemapResult {
  hasRobotsTxt: boolean;
  robotsTxtContent: string | null;
  robotsTxtIssues: string[];
  hasSitemap: boolean;
  sitemapUrl: string | null;
  sitemapIssues: string[];
}

export interface SecurityHeadersResult {
  headers: Record<string, string | null>;
  score: number;
  issues: string[];
  recommendations: string[];
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0; +https://arsenio.at)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(30000), // 30 Sekunden Timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);
  const isHttps = url.startsWith("https://");

  // Meta Tags
  const title = $("title").text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() || "";
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const robots = $('meta[name="robots"]').attr("content") || "";
  const lang = $("html").attr("lang") || "";
  const keywords = $('meta[name="keywords"]').attr("content")?.trim() || "";
  const author = $('meta[name="author"]').attr("content")?.trim() || "";
  const generator = $('meta[name="generator"]').attr("content")?.trim() || "";

  // Open Graph Tags
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr("property")?.replace("og:", "") || "";
    const content = $(el).attr("content") || "";
    if (property) ogTags[property] = content;
  });

  // Twitter Tags
  const twitterTags: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr("name")?.replace("twitter:", "") || "";
    const content = $(el).attr("content") || "";
    if (name) twitterTags[name] = content;
  });

  // Headings
  const headings = {
    h1: $("h1")
      .map((_, el) => $(el).text().trim())
      .get(),
    h2: $("h2")
      .map((_, el) => $(el).text().trim())
      .get(),
    h3: $("h3")
      .map((_, el) => $(el).text().trim())
      .get(),
    h4: $("h4")
      .map((_, el) => $(el).text().trim())
      .get(),
    h5: $("h5")
      .map((_, el) => $(el).text().trim())
      .get(),
    h6: $("h6")
      .map((_, el) => $(el).text().trim())
      .get(),
  };

  // Images
  const images: Array<{ src: string; alt: string | null; lazy: boolean }> = [];
  let lazyLoadedCount = 0;
  let withDimensionsCount = 0;
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    const alt = $(el).attr("alt") ?? null;
    const loading = $(el).attr("loading");
    const hasLazy = loading === "lazy" || $(el).attr("data-src") !== undefined;
    const hasWidth = $(el).attr("width") !== undefined;
    const hasHeight = $(el).attr("height") !== undefined;

    if (hasLazy) lazyLoadedCount++;
    if (hasWidth && hasHeight) withDimensionsCount++;
    if (src) images.push({ src, alt, lazy: hasLazy });
  });

  // Links
  const allLinks: Array<{ href: string; text: string; isExternal: boolean }> =
    [];
  let internalCount = 0;
  let externalCount = 0;
  let nofollowCount = 0;
  let emptyAnchors = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const rel = $(el).attr("rel") || "";
    const ariaLabel = $(el).attr("aria-label") || "";

    // Count empty anchors (no text, no aria-label)
    if (!text && !ariaLabel && !$(el).find("img").length) {
      emptyAnchors++;
    }

    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let isExternal = false;
    try {
      const linkUrl = new URL(href, url);
      isExternal = linkUrl.hostname !== baseUrl.hostname;
    } catch {
      isExternal = href.startsWith("http");
    }

    if (isExternal) {
      externalCount++;
    } else {
      internalCount++;
    }

    if (rel.includes("nofollow")) {
      nofollowCount++;
    }

    allLinks.push({ href, text, isExternal });
  });

  // Text Content
  const $bodyClone = cheerio.load($.html())("body");
  $bodyClone.find("script, style, noscript").remove();
  const textContent = $bodyClone.text().replace(/\s+/g, " ").trim();
  const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

  // Technical Checks
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasFavicon =
    $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
  const hasServiceWorker = html.includes("serviceWorker") || html.includes("service-worker");
  const hasManifest = $('link[rel="manifest"]').length > 0;

  // Structured Data
  const structuredDataTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      if (data["@type"]) structuredDataTypes.push(data["@type"]);
      if (Array.isArray(data["@graph"])) {
        data["@graph"].forEach((item: { "@type"?: string }) => {
          if (item["@type"]) structuredDataTypes.push(item["@type"]);
        });
      }
    } catch {
      // ignore parse errors
    }
  });

  // CMS Detection
  let detectedCms: string | null = null;
  const detectedTechnologies: string[] = [];

  // CMS
  if (html.includes("wp-content") || html.includes("wordpress") || generator.toLowerCase().includes("wordpress")) {
    detectedCms = "WordPress";
  } else if (html.includes("wix.com") || html.includes("static.wixstatic")) {
    detectedCms = "Wix";
  } else if (html.includes("squarespace")) {
    detectedCms = "Squarespace";
  } else if (html.includes("shopify") || html.includes("cdn.shopify")) {
    detectedCms = "Shopify";
  } else if (html.includes("webflow")) {
    detectedCms = "Webflow";
  } else if (html.includes("joomla") || generator.toLowerCase().includes("joomla")) {
    detectedCms = "Joomla";
  } else if (html.includes("drupal") || generator.toLowerCase().includes("drupal")) {
    detectedCms = "Drupal";
  } else if (html.includes("typo3") || generator.toLowerCase().includes("typo3")) {
    detectedCms = "TYPO3";
  } else if (html.includes("jimdo")) {
    detectedCms = "Jimdo";
  } else if (html.includes("weebly")) {
    detectedCms = "Weebly";
  } else if (html.includes("ghost.io") || generator.toLowerCase().includes("ghost")) {
    detectedCms = "Ghost";
  }

  // Technologies/Frameworks
  if (html.includes("react") || html.includes("__NEXT_DATA__")) detectedTechnologies.push("React/Next.js");
  if (html.includes("vue") || html.includes("__VUE__")) detectedTechnologies.push("Vue.js");
  if (html.includes("angular") || html.includes("ng-")) detectedTechnologies.push("Angular");
  if (html.includes("bootstrap")) detectedTechnologies.push("Bootstrap");
  if (html.includes("tailwind")) detectedTechnologies.push("Tailwind CSS");
  if (html.includes("jquery") || html.includes("jQuery")) detectedTechnologies.push("jQuery");
  if (html.includes("cloudflare")) detectedTechnologies.push("Cloudflare");
  if (html.includes("cdn.jsdelivr") || html.includes("cdnjs.cloudflare")) detectedTechnologies.push("CDN");
  if (html.includes("stripe")) detectedTechnologies.push("Stripe");
  if (html.includes("paypal")) detectedTechnologies.push("PayPal");
  if (html.includes("recaptcha") || html.includes("grecaptcha")) detectedTechnologies.push("reCAPTCHA");
  if (html.includes("cookiebot") || html.includes("cookie-consent") || html.includes("cookieconsent")) {
    detectedTechnologies.push("Cookie Consent");
  }

  // Analytics Detection
  const hasGoogleAnalytics =
    html.includes("google-analytics.com") ||
    html.includes("gtag") ||
    html.includes("ga(") ||
    html.includes("analytics.js");
  const hasGoogleTagManager = html.includes("googletagmanager.com") || html.includes("gtm.js");
  const hasFacebookPixel =
    html.includes("facebook.com/tr") || html.includes("fbq(") || html.includes("connect.facebook.net");
  const hasHotjar = html.includes("hotjar") || html.includes("hj(");

  // Inline CSS/JS
  const inlineCss = $("style").length > 0 || $("[style]").length > 5;
  const inlineJs =
    $("script:not([src])").filter((_, el) => ($(el).html() || "").length > 100).length > 0;

  // Contact Info
  const emails = html.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ) || [];
  const phones =
    html.match(
      /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
    ) || [];
  // Address detection (simple pattern for German/Austrian addresses)
  const addresses = html.match(
    /\d{4,5}\s+[A-ZÄÖÜa-zäöüß\s]+,?\s*[A-ZÄÖÜa-zäöüß\s]+(?:straße|strasse|gasse|weg|platz|ring)/gi
  ) || [];
  const hasContactForm =
    $('form[action*="contact"], form[id*="contact"], form[class*="contact"]')
      .length > 0 || $('input[type="email"]').length > 0;

  // Social Links
  const socialLinks: Record<string, string> = {};
  const socialPatterns: Record<string, RegExp> = {
    facebook: /facebook\.com/,
    instagram: /instagram\.com/,
    twitter: /twitter\.com|x\.com/,
    linkedin: /linkedin\.com/,
    youtube: /youtube\.com/,
    tiktok: /tiktok\.com/,
    pinterest: /pinterest\.com/,
    whatsapp: /wa\.me|whatsapp\.com/,
  };

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !socialLinks[platform]) {
        socialLinks[platform] = href;
      }
    }
  });

  // Security Checks
  const hasMixedContent = isHttps && (
    $('img[src^="http://"]').length > 0 ||
    $('script[src^="http://"]').length > 0 ||
    $('link[href^="http://"]').length > 0
  );
  const externalScripts: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    try {
      const scriptUrl = new URL(src, url);
      if (scriptUrl.hostname !== baseUrl.hostname) {
        externalScripts.push(scriptUrl.hostname);
      }
    } catch {
      // ignore invalid URLs
    }
  });

  // Accessibility Checks
  const hasSkipLink = $('a[href="#main"], a[href="#content"], a.skip-link, a.skip-to-content').length > 0;
  const hasMainLandmark = $('main, [role="main"]').length > 0;
  const hasNavLandmark = $('nav, [role="navigation"]').length > 0;
  const hasAriaLabels = $('[aria-label], [aria-labelledby], [aria-describedby]').length > 0;

  // Form label checks
  let formsWithLabels = 0;
  let formsWithoutLabels = 0;
  $('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').each((_, el) => {
    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label");
    const placeholder = $(el).attr("placeholder");
    const hasLabel = id && $(`label[for="${id}"]`).length > 0;

    if (hasLabel || ariaLabel) {
      formsWithLabels++;
    } else if (!placeholder) {
      formsWithoutLabels++;
    }
  });

  // Tabindex issues (positive tabindex is bad practice)
  const tabindexIssues = $('[tabindex]').filter((_, el) => {
    const tabindex = parseInt($(el).attr("tabindex") || "0", 10);
    return tabindex > 0;
  }).length;

  // Contrast hint (check for very light text colors)
  const contrastIssuesHint = html.includes("color: #fff") ||
    html.includes("color:#fff") ||
    html.includes("color: white") ||
    html.includes("color:white");

  // Performance Checks
  const totalScripts = $("script").length;
  const externalScriptCount = $("script[src]").length;
  const totalStylesheets = $('link[rel="stylesheet"]').length;
  const externalStylesheets = $('link[rel="stylesheet"][href^="http"]').length;
  const hasAsyncScripts = $("script[async]").length > 0;
  const hasDeferScripts = $("script[defer]").length > 0;
  const hasPreconnect = $('link[rel="preconnect"]').length > 0;
  const hasPreload = $('link[rel="preload"]').length > 0;
  const hasDnsPrefetch = $('link[rel="dns-prefetch"]').length > 0;
  const estimatedDomSize = $("*").length;
  const iframeCount = $("iframe").length;

  // ============================================
  // NEW: Design Analysis - Colors & Fonts
  // ============================================

  // Helper: Check if color is a boring utility color (white, black, gray)
  const isBoringColor = (hex: string): boolean => {
    const h = hex.toLowerCase().replace('#', '');
    // Expand 3-char to 6-char
    const full = h.length === 3 ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2] : h;
    const r = parseInt(full.slice(0,2), 16);
    const g = parseInt(full.slice(2,4), 16);
    const b = parseInt(full.slice(4,6), 16);

    // Pure white/black
    if ((r > 250 && g > 250 && b > 250) || (r < 5 && g < 5 && b < 5)) return true;
    // Grays (r ≈ g ≈ b)
    const diff = Math.max(r,g,b) - Math.min(r,g,b);
    if (diff < 20 && r > 30 && r < 230) return true;
    // Near-white
    if (r > 240 && g > 240 && b > 240) return true;
    // Near-black
    if (r < 15 && g < 15 && b < 15) return true;

    return false;
  };

  // Count color occurrences to find main colors
  const colorCounts: Map<string, number> = new Map();

  // Extract colors from inline styles and CSS
  const colorMatches = html.match(/#[0-9A-Fa-f]{3,6}/g) || [];
  colorMatches.forEach(color => {
    const normalized = color.toLowerCase();
    // Skip very short or invalid
    if (normalized.length < 4) return;
    // Normalize 3-char to 6-char for comparison
    const full = normalized.length === 4
      ? '#' + normalized[1]+normalized[1]+normalized[2]+normalized[2]+normalized[3]+normalized[3]
      : normalized;

    if (!isBoringColor(full)) {
      colorCounts.set(full, (colorCounts.get(full) || 0) + 1);
    }
  });

  // Also look for colors in important places (buttons, links, brand elements)
  const brandColorPatterns = [
    /\.btn[^{]*\{[^}]*(?:background|color):\s*(#[0-9A-Fa-f]{3,6})/gi,
    /\.button[^{]*\{[^}]*(?:background|color):\s*(#[0-9A-Fa-f]{3,6})/gi,
    /a\s*\{[^}]*color:\s*(#[0-9A-Fa-f]{3,6})/gi,
    /\.primary[^{]*\{[^}]*(?:background|color):\s*(#[0-9A-Fa-f]{3,6})/gi,
    /\.accent[^{]*\{[^}]*(?:background|color):\s*(#[0-9A-Fa-f]{3,6})/gi,
    /--primary[^:]*:\s*(#[0-9A-Fa-f]{3,6})/gi,
    /--accent[^:]*:\s*(#[0-9A-Fa-f]{3,6})/gi,
    /--brand[^:]*:\s*(#[0-9A-Fa-f]{3,6})/gi,
  ];

  brandColorPatterns.forEach(pattern => {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const color = match[1].toLowerCase();
        if (!isBoringColor(color)) {
          // Brand colors get extra weight
          colorCounts.set(color, (colorCounts.get(color) || 0) + 10);
        }
      }
    }
  });

  // Sort by frequency and take top colors
  const sortedColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  const extractedColors = new Set(sortedColors.slice(0, 10));

  // Extract fonts
  const extractedFonts: Set<string> = new Set();
  const fontMatches = html.match(/font-family:\s*['"]?([^'";,}]+)/gi) || [];
  fontMatches.forEach(match => {
    const font = match.replace(/font-family:\s*['"]?/i, "").trim();
    if (font && !font.includes("{") && font.length < 50) {
      extractedFonts.add(font);
    }
  });

  // Check for Google Fonts
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const familyMatch = href.match(/family=([^&:]+)/);
    if (familyMatch) {
      familyMatch[1].split("|").forEach(f => extractedFonts.add(f.replace(/\+/g, " ")));
    }
  });

  // Dark mode detection
  const hasDarkMode = html.includes("dark-mode") ||
    html.includes("dark-theme") ||
    html.includes('prefers-color-scheme') ||
    html.includes("theme-dark");

  // ============================================
  // NEW: Business Features
  // ============================================

  // Online Booking Detection
  let hasOnlineBooking = false;
  let bookingSystem: string | null = null;

  const bookingSystems: Record<string, RegExp> = {
    "Calendly": /calendly\.com/i,
    "Booksy": /booksy\.com/i,
    "Treatwell": /treatwell/i,
    "Shore": /shore\.com/i,
    "SimplyBook": /simplybook/i,
    "Acuity": /acuityscheduling/i,
    "Square Appointments": /squareup.*appointment/i,
    "Timify": /timify/i,
    "Terminland": /terminland/i,
    "Doctolib": /doctolib/i,
  };

  for (const [name, pattern] of Object.entries(bookingSystems)) {
    if (pattern.test(html)) {
      hasOnlineBooking = true;
      bookingSystem = name;
      break;
    }
  }

  // Also check for generic booking buttons
  if (!hasOnlineBooking) {
    const hasBookingButton = $('a, button').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes("termin") || text.includes("buchen") || text.includes("reserv") || text.includes("book");
    }).length > 0;
    if (hasBookingButton) hasOnlineBooking = true;
  }

  // Google Maps Detection
  const hasGoogleMaps = html.includes("maps.google") ||
    html.includes("google.com/maps") ||
    html.includes("maps.googleapis.com") ||
    $('iframe[src*="google.com/maps"]').length > 0;

  // Price List Detection
  const hasPriceList = html.toLowerCase().includes("preis") &&
    (html.includes("€") || html.includes("EUR") || html.toLowerCase().includes("euro")) ||
    $('*').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return (text.includes("preisliste") || text.includes("preise") || text.includes("tarife"));
    }).length > 0;

  // Legal Pages Detection - check links AND raw HTML
  const htmlLower = html.toLowerCase();

  const hasImpressum = allLinks.some(l =>
    l.href.toLowerCase().includes("impressum") ||
    l.text.toLowerCase().includes("impressum")
  ) || (htmlLower.includes("impressum") && (htmlLower.includes('href') || $('*:contains("Impressum")').length > 0));

  const hasDatenschutz = allLinks.some(l =>
    l.href.toLowerCase().includes("datenschutz") ||
    l.href.toLowerCase().includes("privacy") ||
    l.text.toLowerCase().includes("datenschutz")
  ) || (htmlLower.includes("datenschutz") || htmlLower.includes("privacy-policy") || htmlLower.includes("privacypolicy"));

  const hasAGB = allLinks.some(l =>
    l.href.toLowerCase().includes("agb") ||
    l.text.toLowerCase().includes("agb") ||
    l.text.toLowerCase().includes("geschäftsbedingungen")
  ) || htmlLower.includes("/agb") || htmlLower.includes("allgemeine geschäftsbedingungen");

  // ============================================
  // NEW: Readability Score (Flesch-like)
  // ============================================
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = textContent.split(/\s+/).filter(w => w.length > 0);
  const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const avgWordLength = words.length > 0 ?
    Math.round(words.reduce((sum, w) => sum + w.length, 0) / words.length * 10) / 10 : 0;

  // Simple readability score (higher = easier to read)
  // Based on average sentence length and word length
  let readabilityScore = 100;
  if (avgSentenceLength > 20) readabilityScore -= (avgSentenceLength - 20) * 2;
  if (avgWordLength > 6) readabilityScore -= (avgWordLength - 6) * 10;
  readabilityScore = Math.max(0, Math.min(100, Math.round(readabilityScore)));

  let readabilityLevel = "Einfach";
  if (readabilityScore < 60) readabilityLevel = "Komplex";
  else if (readabilityScore < 80) readabilityLevel = "Mittel";

  return {
    meta: {
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      canonical,
      robots,
      ogTags,
      twitterTags,
      lang,
      keywords,
      author,
      generator,
    },
    headings,
    images: {
      total: images.length,
      missingAlt: images.filter((img) => !img.alt || img.alt.trim() === "").length,
      lazyLoaded: lazyLoadedCount,
      withDimensions: withDimensionsCount,
      images: images.slice(0, 20), // Limit to first 20
    },
    links: {
      internal: internalCount,
      external: externalCount,
      total: allLinks.length,
      nofollow: nofollowCount,
      emptyAnchors,
      allLinks: allLinks.slice(0, 50), // Limit to first 50
    },
    content: {
      wordCount,
      textContent: textContent.slice(0, 5000), // Limit text content
      readingTime,
    },
    technical: {
      hasViewport,
      hasFavicon,
      hasStructuredData: structuredDataTypes.length > 0,
      structuredDataTypes,
      detectedCms,
      detectedTechnologies: [...new Set(detectedTechnologies)],
      hasGoogleAnalytics,
      hasGoogleTagManager,
      hasFacebookPixel,
      hasHotjar,
      inlineCss,
      inlineJs,
      hasServiceWorker,
      hasManifest,
    },
    contact: {
      emails: [...new Set(emails)].slice(0, 5),
      phones: [...new Set(phones)].slice(0, 5),
      addresses: [...new Set(addresses)].slice(0, 3),
      hasContactForm,
      socialLinks,
    },
    security: {
      isHttps,
      hasMixedContent,
      externalScripts: [...new Set(externalScripts)].slice(0, 10),
    },
    accessibility: {
      hasSkipLink,
      hasMainLandmark,
      hasNavLandmark,
      formsWithLabels,
      formsWithoutLabels,
      hasAriaLabels,
      tabindexIssues,
      contrastIssuesHint,
    },
    performance: {
      totalScripts,
      externalScripts: externalScriptCount,
      totalStylesheets,
      externalStylesheets,
      hasAsyncScripts,
      hasDeferScripts,
      hasPreconnect,
      hasPreload,
      hasDnsPrefetch,
      estimatedDomSize,
      iframeCount,
    },
    design: {
      colors: [...extractedColors].slice(0, 10),
      fonts: [...extractedFonts].slice(0, 5),
      hasDarkMode,
    },
    business: {
      hasOnlineBooking,
      bookingSystem,
      hasGoogleMaps,
      hasPriceList,
      hasImpressum,
      hasDatenschutz,
      hasAGB,
    },
    readability: {
      avgSentenceLength,
      avgWordLength,
      score: readabilityScore,
      level: readabilityLevel,
    },
  };
}

export async function checkBrokenLinks(
  links: Array<{ href: string; isExternal: boolean }>,
  baseUrl: string,
  limit = 8
): Promise<Array<{ url: string; status: number | string; type: string }>> {
  const linksToCheck = links.slice(0, limit);

  // Run all checks in parallel for speed (max ~3 seconds total instead of 40+)
  const checkPromises = linksToCheck.map(async (link) => {
    let fullUrl = link.href;
    if (!fullUrl.startsWith("http")) {
      try {
        fullUrl = new URL(link.href, baseUrl).toString();
      } catch {
        return null;
      }
    }

    try {
      const response = await fetch(fullUrl, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(3000),
      });

      if (response.status >= 400) {
        return { url: fullUrl, status: response.status, type: "broken" };
      } else if (response.redirected) {
        return { url: fullUrl, status: response.status, type: "redirect" };
      }
      return null;
    } catch {
      return { url: fullUrl, status: "Timeout", type: "timeout" };
    }
  });

  const results = await Promise.all(checkPromises);
  return results.filter((r) => r !== null) as { url: string; status: number | string; type: string }[];
}

// Check robots.txt and sitemap.xml
export async function checkRobotsSitemap(url: string): Promise<RobotsSitemapResult> {
  const baseUrl = new URL(url);
  const robotsUrl = `${baseUrl.origin}/robots.txt`;
  const result: RobotsSitemapResult = {
    hasRobotsTxt: false,
    robotsTxtContent: null,
    robotsTxtIssues: [],
    hasSitemap: false,
    sitemapUrl: null,
    sitemapIssues: [],
  };

  // Check robots.txt
  try {
    const robotsResponse = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (robotsResponse.ok) {
      result.hasRobotsTxt = true;
      result.robotsTxtContent = await robotsResponse.text();

      // Analyze robots.txt
      const content = result.robotsTxtContent.toLowerCase();
      if (content.includes("disallow: /")) {
        result.robotsTxtIssues.push("Website komplett für Suchmaschinen blockiert");
      }
      if (!content.includes("sitemap:")) {
        result.robotsTxtIssues.push("Keine Sitemap in robots.txt verlinkt");
      } else {
        // Extract sitemap URL
        const sitemapMatch = result.robotsTxtContent.match(/sitemap:\s*(.+)/i);
        if (sitemapMatch) {
          result.sitemapUrl = sitemapMatch[1].trim();
        }
      }
    }
  } catch {
    result.robotsTxtIssues.push("robots.txt konnte nicht geladen werden");
  }

  // Check sitemap
  const sitemapUrls = [
    result.sitemapUrl,
    `${baseUrl.origin}/sitemap.xml`,
    `${baseUrl.origin}/sitemap_index.xml`,
  ].filter(Boolean) as string[];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const sitemapResponse = await fetch(sitemapUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      if (sitemapResponse.ok) {
        result.hasSitemap = true;
        result.sitemapUrl = sitemapUrl;
        break;
      }
    } catch {
      // Try next URL
    }
  }

  if (!result.hasSitemap) {
    result.sitemapIssues.push("Keine Sitemap gefunden");
  }

  return result;
}

// Check security headers
export async function checkSecurityHeaders(url: string): Promise<SecurityHeadersResult> {
  const result: SecurityHeadersResult = {
    headers: {},
    score: 0,
    issues: [],
    recommendations: [],
  };

  const importantHeaders = [
    { name: "strict-transport-security", label: "HSTS", weight: 20 },
    { name: "content-security-policy", label: "CSP", weight: 25 },
    { name: "x-frame-options", label: "X-Frame-Options", weight: 15 },
    { name: "x-content-type-options", label: "X-Content-Type-Options", weight: 10 },
    { name: "referrer-policy", label: "Referrer-Policy", weight: 10 },
    { name: "permissions-policy", label: "Permissions-Policy", weight: 10 },
    { name: "x-xss-protection", label: "X-XSS-Protection", weight: 5 },
    { name: "cross-origin-opener-policy", label: "COOP", weight: 5 },
  ];

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });

    let totalWeight = 0;
    let earnedScore = 0;

    for (const header of importantHeaders) {
      const value = response.headers.get(header.name);
      result.headers[header.name] = value;
      totalWeight += header.weight;

      if (value) {
        earnedScore += header.weight;
      } else {
        result.issues.push(`${header.label} Header fehlt`);

        // Add specific recommendations
        switch (header.name) {
          case "strict-transport-security":
            result.recommendations.push("HSTS aktivieren für sichere HTTPS-Verbindung");
            break;
          case "content-security-policy":
            result.recommendations.push("Content Security Policy definieren gegen XSS-Angriffe");
            break;
          case "x-frame-options":
            result.recommendations.push("X-Frame-Options setzen gegen Clickjacking");
            break;
          case "x-content-type-options":
            result.recommendations.push("X-Content-Type-Options: nosniff setzen");
            break;
        }
      }
    }

    result.score = Math.round((earnedScore / totalWeight) * 100);
  } catch (error) {
    result.issues.push("Security Headers konnten nicht geprüft werden");
    result.score = 0;
  }

  return result;
}

// Combined full analysis function
export async function runFullScrapeAnalysis(url: string) {
  console.log(`Starting full scrape analysis for ${url}`);

  // Run all analyses in parallel with individual error handling
  const [scrapedResult, robotsSitemapResult, securityHeadersResult] = await Promise.allSettled([
    scrapeWebsite(url),
    checkRobotsSitemap(url),
    checkSecurityHeaders(url),
  ]);

  // Extract results with fallbacks
  const scraped = scrapedResult.status === "fulfilled"
    ? scrapedResult.value
    : getDefaultScrapedData(url);

  if (scrapedResult.status === "rejected") {
    console.error(`Scrape failed: ${scrapedResult.reason}`);
  }

  const robotsSitemap: RobotsSitemapResult = robotsSitemapResult.status === "fulfilled"
    ? robotsSitemapResult.value
    : { hasRobotsTxt: false, hasSitemap: false, sitemapUrl: null, robotsTxtContent: null, robotsTxtIssues: [], sitemapIssues: [] };

  const securityHeaders: SecurityHeadersResult = securityHeadersResult.status === "fulfilled"
    ? securityHeadersResult.value
    : { score: 0, headers: {}, issues: ["Konnte nicht geprüft werden"], recommendations: [] };

  return {
    scraped,
    robotsSitemap,
    securityHeaders,
  };
}

// Fallback für fehlgeschlagenes Scraping
function getDefaultScrapedData(url: string): ScrapedData {
  return {
    meta: {
      title: "",
      titleLength: 0,
      description: "",
      descriptionLength: 0,
      canonical: "",
      robots: "",
      ogTags: {},
      twitterTags: {},
      lang: "",
      keywords: "",
      author: "",
      generator: "",
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
    images: { total: 0, missingAlt: 0, lazyLoaded: 0, withDimensions: 0, images: [] },
    links: { internal: 0, external: 0, total: 0, nofollow: 0, emptyAnchors: 0, allLinks: [] },
    content: { wordCount: 0, textContent: "", readingTime: 0 },
    technical: {
      hasViewport: false,
      hasFavicon: false,
      hasStructuredData: false,
      structuredDataTypes: [],
      detectedCms: null,
      detectedTechnologies: [],
      hasGoogleAnalytics: false,
      hasGoogleTagManager: false,
      hasFacebookPixel: false,
      hasHotjar: false,
      inlineCss: false,
      inlineJs: false,
      hasServiceWorker: false,
      hasManifest: false,
    },
    security: { isHttps: url.startsWith("https://"), hasMixedContent: false, externalScripts: [] },
    contact: { emails: [], phones: [], addresses: [], socialLinks: {}, hasContactForm: false },
    accessibility: {
      hasSkipLink: false,
      hasMainLandmark: false,
      hasNavLandmark: false,
      formsWithLabels: 0,
      formsWithoutLabels: 0,
      hasAriaLabels: false,
      tabindexIssues: 0,
      contrastIssuesHint: false,
    },
    performance: {
      totalScripts: 0,
      externalScripts: 0,
      totalStylesheets: 0,
      externalStylesheets: 0,
      hasAsyncScripts: false,
      hasDeferScripts: false,
      hasPreconnect: false,
      hasPreload: false,
      hasDnsPrefetch: false,
      estimatedDomSize: 0,
      iframeCount: 0,
    },
    design: {
      colors: [],
      fonts: [],
      hasDarkMode: false,
    },
    business: {
      hasOnlineBooking: false,
      bookingSystem: null,
      hasGoogleMaps: false,
      hasPriceList: false,
      hasImpressum: false,
      hasDatenschutz: false,
      hasAGB: false,
    },
    readability: {
      avgSentenceLength: 0,
      avgWordLength: 0,
      score: 0,
      level: "N/A",
    },
  };
}
