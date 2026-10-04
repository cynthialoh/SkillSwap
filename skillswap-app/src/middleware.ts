import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Members: everything open (prototype). Admins: /admin/* needs role=admin.
// Real role check reads sessionClaims.publicMetadata.role (set in Clerk dashboard).
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return NextResponse.next();
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)
    ?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
