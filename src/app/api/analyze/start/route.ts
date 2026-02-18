import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/turso";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

// CORS headers for widget
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
        { status: 400, headers: corsHeaders }
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

    // Note: Process is triggered by the client/widget, not here
    // This prevents duplicate analysis runs

    return NextResponse.json({
      success: true,
      leadId,
      message: "Analyse gestartet! Sie können den Fortschritt verfolgen.",
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Start analysis error:", error);
    return NextResponse.json(
      {
        error: "Fehler beim Starten der Analyse",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
