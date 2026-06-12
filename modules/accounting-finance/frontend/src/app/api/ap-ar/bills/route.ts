import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/ap-ar/bills`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/ap-ar/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
