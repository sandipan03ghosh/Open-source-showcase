import NextAuth from "next-auth";
import GitHub, { type GitHubProfile } from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      authorization: {
        params: { scope: "read:user user:email public_repo" },
      },
      profile(profile: GitHubProfile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubId: profile.id,
          username: profile.login,
          avatarUrl: profile.avatar_url,
          bio: profile.bio ?? null,
          githubUrl: profile.html_url,
          company: profile.company ?? null,
          websiteUrl: profile.blog || null,
          location: profile.location ?? null,
          followersCount: profile.followers ?? 0,
          followingCount: profile.following ?? 0,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (user.isBanned) return false;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "USER";
        token.username = user.username ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.id) {
        session.id = token.id;
        session.user.role = token.role ?? "USER";
        session.user.username = token.username ?? null;
      }
      return session;
    },
  },

  events: {
    // Refresh the cached GitHub profile snapshot on every sign-in, not just
    // account creation, since bio/followers/company drift over time.
    async signIn({ user, profile }) {
      if (!user.id || !profile) return;
      const gh = profile as GitHubProfile;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            username: gh.login,
            avatarUrl: gh.avatar_url,
            bio: gh.bio ?? null,
            githubUrl: gh.html_url,
            company: gh.company ?? null,
            websiteUrl: gh.blog || null,
            location: gh.location ?? null,
            followersCount: gh.followers ?? 0,
            followingCount: gh.following ?? 0,
          },
        });
      } catch (error) {
        console.error("Failed to refresh GitHub profile snapshot:", error);
      }
    },
  },
});
