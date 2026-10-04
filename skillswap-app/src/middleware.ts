import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Members: everything open (prototype). Admins: /admin/* needs role=admin.
// Real role check reads sessionClaims.publicMetadata.role (set in Clerk dashboard).
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return NextResponse.next();
  const { sessionClaims } = await auth();
  const claims = sessionClaims as
    | { publicMetadata?: { role?: string }; email?: string }
    | undefined;
  const role = claims?.publicMetadata?.role;
  // Fallback: emails in ADMIN_EMAILS (comma-separated) are admins too.
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = claims?.email?.toLowerCase();
  if (role !== "admin" && !(email && allowlist.includes(email))) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
