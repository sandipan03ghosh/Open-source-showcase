import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    githubId?: number | null;
    username?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    githubUrl?: string | null;
    company?: string | null;
    websiteUrl?: string | null;
    location?: string | null;
    followersCount?: number;
    followingCount?: number;
    role?: "USER" | "ADMIN" | "MODERATOR";
    isBanned?: boolean;
  }

  interface Session {
    id: string;
    user: DefaultSession["user"] & {
      username?: string | null;
      role: "USER" | "ADMIN" | "MODERATOR";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN" | "MODERATOR";
    username?: string | null;
  }
}
