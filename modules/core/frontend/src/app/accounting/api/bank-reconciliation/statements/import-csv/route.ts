import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/api/v1/bank-reconciliation/statements/import-csv`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to import CSV" },
      { status: 500 }
    );
  }
}
