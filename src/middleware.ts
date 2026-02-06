import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:1420", // Tauri dev (Vite)
  "http://127.0.0.1:1420",
  "tauri://localhost",     // Tauri production (macOS)
  "https://tauri.localhost", // Tauri production (Windows)
  "http://tauri.localhost",
];

const resolveCorsOrigin = (origin: string) => {
  // WebView / Tauri often sends `Origin: null`
  if (origin === "null") return "null";
  if (!origin) return "*";
  if (origin.startsWith("tauri://")) return origin;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return "*";
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin = resolveCorsOrigin(origin);

  // Handle preflight (OPTIONS)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Add CORS headers to all API responses
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

// Only apply to API routes
export const config = {
  matcher: "/api/:path*",
};
