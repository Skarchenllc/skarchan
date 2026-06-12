import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/currency/base-currency/${params.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error setting base currency:", error);
    return NextResponse.json(
      { error: "Failed to set base currency" },
      { status: 500 }
    );
  }
}
