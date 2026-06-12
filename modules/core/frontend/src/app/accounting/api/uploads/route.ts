import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/v1/uploads/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error.message}` },
      { status: 500 }
    );
  }
}
