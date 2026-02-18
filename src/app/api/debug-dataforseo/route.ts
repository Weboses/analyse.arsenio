import { NextRequest, NextResponse } from "next/server";

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || "";
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "arsenio.at";

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return NextResponse.json({ error: "DataForSEO not configured" });
  }

  const auth = "Basic " + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");

  try {
    // Test ranked keywords
    const rankingsResponse = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live", {
      method: "POST",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        target: domain,
        location_code: 2040,
        language_code: "de",
        limit: 10,
      }]),
    });

    const rankingsData = await rankingsResponse.json();

    // Test backlinks
    const backlinksResponse = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        target: domain,
        include_subdomains: true,
      }]),
    });

    const backlinksData = await backlinksResponse.json();

    return NextResponse.json({
      testedDomain: domain,
      timestamp: new Date().toISOString(),
      rankings: {
        status: rankingsData.status_code,
        target: rankingsData.tasks?.[0]?.result?.[0]?.target,
        totalCount: rankingsData.tasks?.[0]?.result?.[0]?.total_count,
        items: rankingsData.tasks?.[0]?.result?.[0]?.items?.slice(0, 5)?.map((item: any) => ({
          keyword: item.keyword_data?.keyword,
          position: item.ranked_serp_element?.serp_item?.rank_absolute,
          url: item.ranked_serp_element?.serp_item?.url,
          searchVolume: item.keyword_data?.keyword_info?.search_volume,
        })),
        rawFirstItem: rankingsData.tasks?.[0]?.result?.[0]?.items?.[0],
      },
      backlinks: {
        status: backlinksData.status_code,
        target: backlinksData.tasks?.[0]?.result?.[0]?.target,
        totalBacklinks: backlinksData.tasks?.[0]?.result?.[0]?.backlinks,
        referringDomains: backlinksData.tasks?.[0]?.result?.[0]?.referring_domains,
        rank: backlinksData.tasks?.[0]?.result?.[0]?.rank,
        rawResult: backlinksData.tasks?.[0]?.result?.[0],
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: "API Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
