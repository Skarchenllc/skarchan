import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const as_of_date = searchParams.get("as_of_date");

    let url = `${BACKEND_URL}/api/v1/reports/trial-balance`;
    if (as_of_date) {
      url += `?as_of_date=${as_of_date}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch trial balance" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Trial balance API error:", error);
    return NextResponse.json(
      { error: `Failed to fetch trial balance: ${error.message}` },
      { status: 500 }
    );
  }
}
