import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Edge-safe: built from the adapter-less config so this never pulls
// Prisma's Node engine into the Edge middleware bundle.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/submit/:path*", "/collections/new/:path*", "/admin/:path*"],
};
