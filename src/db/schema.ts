import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  websiteUrl: text("website_url").notNull(),
  status: text("status").default("pending"), // pending, analyzing, completed, failed
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const analysisResults = sqliteTable("analysis_results", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").references(() => leads.id),

  // PageSpeed Scores (0-100)
  performanceScoreMobile: integer("performance_score_mobile"),
  performanceScoreDesktop: integer("performance_score_desktop"),
  accessibilityScore: integer("accessibility_score"),
  bestPracticesScore: integer("best_practices_score"),
  seoScore: integer("seo_score"),

  // Core Web Vitals
  lcpMobile: text("lcp_mobile"), // z.B. "2.5 s"
  lcpDesktop: text("lcp_desktop"),
  fcpMobile: text("fcp_mobile"),
  fcpDesktop: text("fcp_desktop"),
  clsMobile: text("cls_mobile"),
  clsDesktop: text("cls_desktop"),
  tbtMobile: text("tbt_mobile"),
  tbtDesktop: text("tbt_desktop"),

  // SEO Data
  metaTitle: text("meta_title"),
  metaTitleLength: integer("meta_title_length"),
  metaDescription: text("meta_description"),
  metaDescriptionLength: integer("meta_description_length"),
  hasH1: integer("has_h1"), // 0 or 1 (boolean)
  h1Count: integer("h1_count"),
  h2Count: integer("h2_count"),
  h3Count: integer("h3_count"),
  missingAltImages: integer("missing_alt_images"),
  totalImages: integer("total_images"),
  hasSitemap: integer("has_sitemap"),
  hasRobotsTxt: integer("has_robots_txt"),

  // Technical
  isHttps: integer("is_https"),
  isMobileFriendly: integer("is_mobile_friendly"),
  detectedCms: text("detected_cms"), // WordPress, Wix, Squarespace, etc.
  detectedTechnologies: text("detected_technologies"), // JSON array
  securityScore: integer("security_score"), // 0-100 based on security headers

  // Links
  totalLinks: integer("total_links"),
  internalLinks: integer("internal_links"),
  externalLinks: integer("external_links"),
  brokenLinksCount: integer("broken_links_count"),
  brokenLinks: text("broken_links"), // JSON string

  // AI Recommendations
  aiRecommendations: text("ai_recommendations"),
  htmlReport: text("html_report"),

  // Raw Data (JSON)
  rawMobileData: text("raw_mobile_data"),
  rawDesktopData: text("raw_desktop_data"),
  rawSeoData: text("raw_seo_data"),

  // Meta
  screenshotUrl: text("screenshot_url"),
  analyzedAt: text("analyzed_at").default("CURRENT_TIMESTAMP"),
  emailSent: integer("email_sent").default(0),
  emailSentAt: text("email_sent_at"),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;
