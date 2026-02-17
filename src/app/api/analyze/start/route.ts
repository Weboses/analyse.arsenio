import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/turso";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

interface StartAnalyzeRequest {
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
    const body: StartAnalyzeRequest = await request.json();

    // Validierung
    if (!body.firstName || !body.email || !body.websiteUrl) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 }
      );
    }

    const websiteUrl = normalizeUrl(body.websiteUrl);
    const email = body.email.toLowerCase().trim();

    // Check if lead exists, if so update, otherwise create
    const existingLead = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.email, email))
      .limit(1);

    let leadId: string;
    if (existingLead.length > 0) {
      leadId = existingLead[0].id as string;
      await db
        .update(leads)
        .set({
          firstName: body.firstName.trim(),
          websiteUrl,
          status: "queued",
        })
        .where(eq(leads.id, leadId));
    } else {
      leadId = generateId();
      await db.insert(leads).values({
        id: leadId,
        firstName: body.firstName.trim(),
        email,
        websiteUrl,
        status: "queued",
        createdAt: new Date().toISOString(),
      });
    }

    // Note: Frontend will trigger /api/analyze/process after receiving this response

    return NextResponse.json({
      success: true,
      leadId,
      message: "Analyse gestartet! Sie können den Fortschritt verfolgen.",
    });
  } catch (error) {
    console.error("Start analysis error:", error);
    return NextResponse.json(
      {
        error: "Fehler beim Starten der Analyse",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
