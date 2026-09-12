import type { NextAuthConfig } from "next-auth";

const AUTH_REQUIRED_PATHS = ["/submit", "/collections/new"];
const ADMIN_PATHS = ["/admin"];
const MODERATOR_ROLES = ["ADMIN", "MODERATOR"];

/**
 * Edge-safe subset of the Auth.js config — no Prisma adapter, since
 * Middleware runs on the Edge runtime and Prisma's Node engine can't run
 * there. The full config in auth.ts extends this for everywhere else.
 *
 * This route guard is defense-in-depth only: every admin server action
 * re-checks the role itself server-side, since middleware can be bypassed
 * by calling a server action directly.
 */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
        return Boolean(auth?.user && MODERATOR_ROLES.includes(auth.user.role));
      }

      if (AUTH_REQUIRED_PATHS.some((path) => pathname.startsWith(path))) {
        return Boolean(auth?.user);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
