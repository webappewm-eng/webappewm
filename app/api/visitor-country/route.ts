import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const headerCountry =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code") ||
    "Unknown";

  const country = String(headerCountry).trim().toUpperCase() || "Unknown";
  return NextResponse.json({ country });
}
