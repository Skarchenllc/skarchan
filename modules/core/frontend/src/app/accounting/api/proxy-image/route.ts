import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://accounting-backend:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      return NextResponse.json({ error: "No image path provided" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}${imagePath}`);

    if (!response.ok) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: `Failed to load image: ${error.message}` },
      { status: 500 }
    );
  }
}
