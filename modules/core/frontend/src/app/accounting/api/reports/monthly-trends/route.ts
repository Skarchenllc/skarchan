import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/reports/monthly-trends`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: `Failed to connect to backend: ${error.message}` },
      { status: 500 }
    );
  }
}
