import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    let url = `${BACKEND_URL}/api/v1/reports/income-statement`;
    const params = [];
    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch income statement" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Income statement API error:", error);
    return NextResponse.json(
      { error: `Failed to fetch income statement: ${error.message}` },
      { status: 500 }
    );
  }
}
