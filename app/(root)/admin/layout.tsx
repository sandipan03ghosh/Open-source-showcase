import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";

const MODERATOR_ROLES = ["ADMIN", "MODERATOR"];

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/repositories", label: "Repositories" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Defense in depth: middleware already blocks this route for non-admins.
  if (!session?.user || !MODERATOR_ROLES.includes(session.user.role)) {
    redirect("/");
  }

  return (
    <section className="section-container max-w-6xl">
      <div className="flex-between mb-8">
        <h1 className="text-30-bold">Admin</h1>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </section>
  );
}
