import type { Metadata } from "next";
import Link from "next/link";
import { Users, GitBranch, Flag, Star } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin dashboard" };

const StatCard = ({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  value: number;
}) => (
  <Link href={href} className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <p className="text-[28px] font-bold text-foreground mt-2">{value.toLocaleString()}</p>
  </Link>
);

const Page = async () => {
  const [userCount, repositoryCount, openReportCount, featuredCount, bannedCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.repository.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.repository.count({ where: { isFeatured: true } }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <StatCard href="/admin/users" icon={Users} label="Users" value={userCount} />
      <StatCard href="/admin/repositories" icon={GitBranch} label="Repositories" value={repositoryCount} />
      <StatCard href="/admin/reports" icon={Flag} label="Open reports" value={openReportCount} />
      <StatCard href="/admin/repositories" icon={Star} label="Featured repositories" value={featuredCount} />
      <StatCard href="/admin/users" icon={Users} label="Banned users" value={bannedCount} />
    </div>
  );
};

export default Page;
