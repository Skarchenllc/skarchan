import { NextRequest, NextResponse } from "next/server";

// Backend URL for server-side API calls
// Use environment variable or fallback to localhost
const BACKEND_URL = process.env.HR_BACKEND_URL || "http://localhost:8005";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return NextResponse.json(
        { detail: text || "Internal server error" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("HR API GET Error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ""}`;

    // Try to read body, but don't fail if there isn't one
    let body = null;
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON, that's okay for some endpoints
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return NextResponse.json(
        { detail: text || "Internal server error" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("HR API POST Error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ""}`;

    // Try to read body, but don't fail if there isn't one
    let body = null;
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON, that's okay for some endpoints
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("HR API PUT Error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const body = await request.json();
    const url = `${BACKEND_URL}/api/v1/${path}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("HR API PATCH Error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const url = `${BACKEND_URL}/api/v1/${path}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("HR API DELETE Error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
