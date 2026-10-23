import { NextRequest, NextResponse } from "next/server";

// This is a UX boundary, not authorization. Every private backend endpoint
// must validate the database-backed session independently.
export function proxy(request: NextRequest) {
  if (!request.cookies.get("llm_session")?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/settings/:path*"],
};

