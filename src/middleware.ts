import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
})

export const config = { 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - auth/signin (Login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.ts (PWA manifest)
     */
    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|sw.js|manifest.ts).*)",
  ] 
}
