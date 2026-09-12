import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { BadgePlus, LogOut, ShieldCheck } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import { prisma } from "@/lib/prisma";

const Navbar = async () => {
  const session = await auth();

  const notifications = session?.id
    ? await prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
      })
    : [];
  const unreadCount = session?.id
    ? await prisma.notification.count({ where: { userId: session.id, readAt: null } })
    : 0;

  return (
    <header className="px-5 py-3 bg-card border-b border-border sticky top-0 z-40 font-work-sans">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/trending" className="hover:text-foreground transition-colors">
              Trending
            </Link>
            <Link href="/collections" className="hover:text-foreground transition-colors">
              Collections
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {session?.user ? (
            <>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <span className="max-sm:hidden">Showcase a repo</span>
                <BadgePlus className="size-5 sm:hidden" />
              </Link>

              <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />

              {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ShieldCheck className="size-5" />
                  <span className="max-sm:hidden">Admin</span>
                </Link>
              )}

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  <span className="max-sm:hidden">Sign out</span>
                  <LogOut className="size-5 sm:hidden" />
                </button>
              </form>

              <Link href={`/developers/${session.user.username ?? session.id}`}>
                <Avatar className="avatar size-9">
                  <AvatarImage
                    src={session.user.image || undefined}
                    alt={session.user.name || "Your profile"}
                  />
                  <AvatarFallback>
                    {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <button type="submit" className="login-btn flex items-center gap-2">
                <GitHubLogoIcon className="size-4" />
                Sign in with GitHub
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
