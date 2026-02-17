import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/turso";
import { leads, analysisResults } from "@/db/schema";
import { eq } from "drizzle-orm";

const statusSteps: Record<string, { step: number; label: string }> = {
  queued: { step: 0, label: "In Warteschlange..." },
  analyzing_performance: { step: 1, label: "Performance wird analysiert..." },
  analyzing_seo: { step: 2, label: "SEO & Sicherheit werden geprüft..." },
  checking_links: { step: 3, label: "Links werden überprüft..." },
  generating_report: { step: 4, label: "KI erstellt Ihren Bericht..." },
  saving_results: { step: 5, label: "Ergebnisse werden gespeichert..." },
  sending_email: { step: 6, label: "E-Mail wird versendet..." },
  completed: { step: 7, label: "Fertig! E-Mail wurde gesendet." },
  failed: { step: -1, label: "Analyse fehlgeschlagen" },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const lead = leadData[0] as { id: string; firstName: string; email: string; websiteUrl: string; status: string | null };
    const status = lead.status || "queued";
    const statusInfo = statusSteps[status] || { step: 0, label: status };

    // If completed, also get the scores
    let scores = null;
    if (status === "completed") {
      const results = await db
        .select({
          performanceScoreMobile: analysisResults.performanceScoreMobile,
          performanceScoreDesktop: analysisResults.performanceScoreDesktop,
          seoScore: analysisResults.seoScore,
          accessibilityScore: analysisResults.accessibilityScore,
          securityScore: analysisResults.securityScore,
        })
        .from(analysisResults)
        .where(eq(analysisResults.leadId, leadId))
        .limit(1);

      if (results.length > 0) {
        scores = {
          performanceMobile: results[0].performanceScoreMobile,
          performanceDesktop: results[0].performanceScoreDesktop,
          seo: results[0].seoScore,
          accessibility: results[0].accessibilityScore,
          security: results[0].securityScore,
        };
      }
    }

    return NextResponse.json({
      leadId,
      status,
      step: statusInfo.step,
      totalSteps: 7,
      label: statusInfo.label,
      isCompleted: status === "completed",
      isFailed: status === "failed",
      scores,
      websiteUrl: lead.websiteUrl,
      firstName: lead.firstName,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen des Status" },
      { status: 500 }
    );
  }
}
