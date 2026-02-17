import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/turso";
import { leads, analysisResults } from "@/db/schema";
import { runFullPageSpeedAnalysis } from "@/lib/pagespeed";
import { runFullScrapeAnalysis, checkBrokenLinks } from "@/lib/scraper";
import { generateAnalysisReport } from "@/lib/claude";
import { sendAnalysisEmail } from "@/lib/brevo";
import {
  runComprehensiveAnalysis,
  extractKeywordsFromContent,
  isDataForSEOConfigured,
  type ComprehensiveAnalysis,
} from "@/lib/dataforseo";
import { eq } from "drizzle-orm";

export const maxDuration = 120; // 2 Minuten für umfangreiche Analyse

async function updateLeadStatus(leadId: string, status: string) {
  await db.update(leads).set({ status }).where(eq(leads.id, leadId));
}

export async function POST(request: NextRequest) {
  let leadId: string | null = null;

  try {
    const body = await request.json();
    leadId = body.leadId;

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    // Get lead data
    const leadData = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        email: leads.email,
        websiteUrl: leads.websiteUrl,
        status: leads.status,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (leadData.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadData[0] as {
      id: string;
      firstName: string;
      email: string;
      websiteUrl: string;
      status: string | null;
    };
    const websiteUrl = lead.websiteUrl;

    console.log(`[${leadId}] Starting comprehensive analysis for ${websiteUrl}`);

    // ============================================
    // STEP 1: PageSpeed + Basic Scraping
    // ============================================
    await updateLeadStatus(leadId, "analyzing_performance");
    console.log(`[${leadId}] Step 1: PageSpeed & Scraping...`);

    const [pageSpeedResults, scrapeResults] = await Promise.all([
      runFullPageSpeedAnalysis(websiteUrl),
      runFullScrapeAnalysis(websiteUrl),
    ]);

    const { scraped: scrapedData, robotsSitemap, securityHeaders } = scrapeResults;

    // ============================================
    // STEP 2: SEO Deep Analysis (DataForSEO)
    // ============================================
    await updateLeadStatus(leadId, "analyzing_seo");
    console.log(`[${leadId}] Step 2: SEO Deep Analysis...`);

    // Extract keywords from scraped content
    const extractedKeywords = extractKeywordsFromContent(
      scrapedData.meta.title,
      scrapedData.meta.description,
      [...scrapedData.headings.h1, ...scrapedData.headings.h2],
      scrapedData.content.textContent.slice(0, 2000)
    );

    console.log(`[${leadId}] Extracted keywords: ${extractedKeywords.slice(0, 5).join(", ")}`);

    // Run DataForSEO analysis (if configured)
    let seoAnalysis: ComprehensiveAnalysis | null = null;
    if (isDataForSEOConfigured()) {
      console.log(`[${leadId}] DataForSEO is configured - running comprehensive analysis...`);
      try {
        seoAnalysis = await runComprehensiveAnalysis(websiteUrl, extractedKeywords);
        console.log(`[${leadId}] DataForSEO analysis complete:`, {
          rankings: seoAnalysis.rankings.length,
          backlinks: seoAnalysis.backlinks.totalBacklinks,
          competitors: seoAnalysis.competitors.length,
        });
      } catch (error) {
        console.error(`[${leadId}] DataForSEO error (continuing without):`, error);
      }
    } else {
      console.log(`[${leadId}] DataForSEO not configured - skipping SEO deep analysis`);
    }

    // ============================================
    // STEP 3: Broken Links Check
    // ============================================
    await updateLeadStatus(leadId, "checking_links");
    console.log(`[${leadId}] Step 3: Checking links...`);

    const brokenLinks = await checkBrokenLinks(
      scrapedData.links.allLinks,
      websiteUrl,
      8  // Reduced from 20 to stay within timeout
    );

    // ============================================
    // STEP 4: Generate AI Report
    // ============================================
    await updateLeadStatus(leadId, "generating_report");
    console.log(`[${leadId}] Step 4: Generating comprehensive AI report...`);

    const htmlReport = await generateAnalysisReport({
      mobile: pageSpeedResults.mobile,
      desktop: pageSpeedResults.desktop,
      scraped: scrapedData,
      brokenLinks,
      robotsSitemap,
      securityHeaders,
      clientName: lead.firstName,
      websiteUrl,
      // NEW: DataForSEO data
      seoAnalysis,
      extractedKeywords,
    });

    // ============================================
    // STEP 5: Save Results
    // ============================================
    await updateLeadStatus(leadId, "saving_results");
    console.log(`[${leadId}] Step 5: Saving results...`);

    const analysisId = generateId();
    await db.insert(analysisResults).values({
      id: analysisId,
      leadId,
      performanceScoreMobile: pageSpeedResults.mobile.scores.performance,
      performanceScoreDesktop: pageSpeedResults.desktop.scores.performance,
      accessibilityScore: pageSpeedResults.mobile.scores.accessibility,
      bestPracticesScore: pageSpeedResults.mobile.scores.bestPractices,
      seoScore: pageSpeedResults.mobile.scores.seo,
      lcpMobile: pageSpeedResults.mobile.coreWebVitals.lcp,
      lcpDesktop: pageSpeedResults.desktop.coreWebVitals.lcp,
      fcpMobile: pageSpeedResults.mobile.coreWebVitals.fcp,
      fcpDesktop: pageSpeedResults.desktop.coreWebVitals.fcp,
      clsMobile: pageSpeedResults.mobile.coreWebVitals.cls,
      clsDesktop: pageSpeedResults.desktop.coreWebVitals.cls,
      tbtMobile: pageSpeedResults.mobile.coreWebVitals.tbt,
      tbtDesktop: pageSpeedResults.desktop.coreWebVitals.tbt,
      metaTitle: scrapedData.meta.title,
      metaTitleLength: scrapedData.meta.titleLength,
      metaDescription: scrapedData.meta.description,
      metaDescriptionLength: scrapedData.meta.descriptionLength,
      hasH1: scrapedData.headings.h1.length > 0 ? 1 : 0,
      h1Count: scrapedData.headings.h1.length,
      h2Count: scrapedData.headings.h2.length,
      h3Count: scrapedData.headings.h3.length,
      missingAltImages: scrapedData.images.missingAlt,
      totalImages: scrapedData.images.total,
      hasSitemap: robotsSitemap.hasSitemap ? 1 : 0,
      hasRobotsTxt: robotsSitemap.hasRobotsTxt ? 1 : 0,
      isHttps: scrapedData.security.isHttps ? 1 : 0,
      securityScore: securityHeaders.score,
      isMobileFriendly: scrapedData.technical.hasViewport ? 1 : 0,
      detectedCms: scrapedData.technical.detectedCms,
      detectedTechnologies: JSON.stringify(scrapedData.technical.detectedTechnologies),
      totalLinks: scrapedData.links.total,
      internalLinks: scrapedData.links.internal,
      externalLinks: scrapedData.links.external,
      brokenLinksCount: brokenLinks.filter((l) => l.type === "broken").length,
      brokenLinks: JSON.stringify(brokenLinks),
      htmlReport,
      rawMobileData: JSON.stringify(pageSpeedResults.mobile),
      rawDesktopData: JSON.stringify(pageSpeedResults.desktop),
      rawSeoData: JSON.stringify({
        scraped: scrapedData,
        robotsSitemap,
        securityHeaders,
        seoAnalysis, // Include DataForSEO data
      }),
      screenshotUrl: pageSpeedResults.mobile.screenshot || null,
      analyzedAt: new Date().toISOString(),
    });

    // ============================================
    // STEP 6: Send Email
    // ============================================
    await updateLeadStatus(leadId, "sending_email");
    console.log(`[${leadId}] Step 6: Sending email...`);

    const emailSent = await sendAnalysisEmail({
      to: lead.email,
      toName: lead.firstName,
      subject: `${lead.firstName}, Ihre Website-Analyse ist fertig!`,
      htmlContent: htmlReport,
    });

    // Done!
    await updateLeadStatus(leadId, "completed");
    console.log(`[${leadId}] Analysis completed successfully!`);

    if (emailSent) {
      await db
        .update(analysisResults)
        .set({
          emailSent: 1,
          emailSentAt: new Date().toISOString(),
        })
        .where(eq(analysisResults.id, analysisId));
    }

    return NextResponse.json({
      success: true,
      analysisId,
      scores: {
        performanceMobile: pageSpeedResults.mobile.scores.performance,
        performanceDesktop: pageSpeedResults.desktop.scores.performance,
        seo: pageSpeedResults.mobile.scores.seo,
        accessibility: pageSpeedResults.mobile.scores.accessibility,
        security: securityHeaders.score,
      },
      hasDataForSEO: !!seoAnalysis,
    });
  } catch (error) {
    console.error(`[${leadId}] Analysis error:`, error);

    if (leadId) {
      await updateLeadStatus(leadId, "failed");
    }

    return NextResponse.json(
      {
        error: "Analyse fehlgeschlagen",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
