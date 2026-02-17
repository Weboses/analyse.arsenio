import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/turso";
import { leads, analysisResults } from "@/db/schema";
import { runFullPageSpeedAnalysis } from "@/lib/pagespeed";
import { runFullScrapeAnalysis, checkBrokenLinks } from "@/lib/scraper";
import { generateAnalysisReport } from "@/lib/claude";
import { sendAnalysisEmail } from "@/lib/brevo";
import { eq } from "drizzle-orm";

export const maxDuration = 60; // Vercel timeout auf 60 Sekunden

interface AnalyzeRequest {
  firstName: string;
  email: string;
  websiteUrl: string;
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//.test(normalized)) {
    normalized = "https://" + normalized;
  }
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Validierung
    if (!body.firstName || !body.email || !body.websiteUrl) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 }
      );
    }

    const websiteUrl = normalizeUrl(body.websiteUrl);
    const email = body.email.toLowerCase().trim();

    // 1. Check if lead exists, if so update, otherwise create
    const existingLead = await db.select({ id: leads.id }).from(leads).where(eq(leads.email, email)).limit(1);

    let leadId: string;
    if (existingLead.length > 0) {
      // Update existing lead
      leadId = existingLead[0].id as string;
      await db.update(leads).set({
        firstName: body.firstName.trim(),
        websiteUrl,
        status: "analyzing",
      }).where(eq(leads.id, leadId));
      console.log(`Lead updated: ${leadId}`);
    } else {
      // Create new lead
      leadId = generateId();
      await db.insert(leads).values({
        id: leadId,
        firstName: body.firstName.trim(),
        email,
        websiteUrl,
        status: "analyzing",
        createdAt: new Date().toISOString(),
      });
      console.log(`Lead created: ${leadId}`);
    }

    // 2. Analyse starten (parallel)
    const [pageSpeedResults, scrapeResults] = await Promise.all([
      runFullPageSpeedAnalysis(websiteUrl),
      runFullScrapeAnalysis(websiteUrl),
    ]);

    const { scraped: scrapedData, robotsSitemap, securityHeaders } = scrapeResults;

    console.log("PageSpeed and scraping completed");

    // 3. Broken Links prüfen (limitiert auf 20)
    const brokenLinks = await checkBrokenLinks(
      scrapedData.links.allLinks,
      websiteUrl,
      20
    );

    console.log(`Found ${brokenLinks.length} broken links`);

    // 4. KI-Report generieren
    const htmlReport = await generateAnalysisReport({
      mobile: pageSpeedResults.mobile,
      desktop: pageSpeedResults.desktop,
      scraped: scrapedData,
      brokenLinks,
      robotsSitemap,
      securityHeaders,
      clientName: body.firstName,
      websiteUrl,
    });

    console.log("AI report generated");

    // 5. Analyse-Ergebnisse speichern
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
      }),
      screenshotUrl: pageSpeedResults.mobile.screenshot || null,
      analyzedAt: new Date().toISOString(),
    });

    console.log("Analysis results saved");

    // 6. E-Mail senden
    const emailSent = await sendAnalysisEmail({
      to: body.email,
      toName: body.firstName,
      subject: `Ihre Website-Analyse ist fertig, ${body.firstName}!`,
      htmlContent: htmlReport,
    });

    // 7. Status aktualisieren
    await db
      .update(leads)
      .set({
        status: "completed",
      })
      .where(eq(leads.id, leadId));

    if (emailSent) {
      await db
        .update(analysisResults)
        .set({
          emailSent: 1,
          emailSentAt: new Date().toISOString(),
        })
        .where(eq(analysisResults.id, analysisId));
    }

    console.log(`Analysis completed for ${body.email}`);

    return NextResponse.json({
      success: true,
      message: "Analyse erfolgreich! Sie erhalten die Ergebnisse per E-Mail.",
      leadId,
      analysisId,
      scores: {
        performanceMobile: pageSpeedResults.mobile.scores.performance,
        performanceDesktop: pageSpeedResults.desktop.scores.performance,
        seo: pageSpeedResults.mobile.scores.seo,
        accessibility: pageSpeedResults.mobile.scores.accessibility,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        error: "Analyse fehlgeschlagen",
        message:
          error instanceof Error
            ? error.message
            : "Ein unbekannter Fehler ist aufgetreten",
      },
      { status: 500 }
    );
  }
}
