import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Globe, Users, ExternalLink } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { REPOSITORY_CARD_SELECT } from "@/lib/repository-select";
import { getOrganizationMembers, getOrganizationProfile } from "@/lib/github/live";
import RepositoryCard from "@/components/RepositoryCard";

type PageParams = { org: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { org } = await params;
  return { title: `${org} · Organizations` };
}

const Page = async ({ params }: { params: Promise<PageParams> }) => {
  const { org } = await params;

  const organization = await prisma.organization.findUnique({ where: { login: org } });
  if (!organization) return notFound();

  const [profile, members, repositories] = await Promise.all([
    getOrganizationProfile(organization.login),
    getOrganizationMembers(organization.login),
    prisma.repository.findMany({
      where: { organizationId: organization.id },
      orderBy: { stars: "desc" },
      select: REPOSITORY_CARD_SELECT,
    }),
  ]);

  return (
    <>
      <section className="hero-container !min-h-[220px]">
        {(profile?.avatarUrl || organization.avatarUrl) && (
          <Image
            src={profile?.avatarUrl ?? organization.avatarUrl!}
            alt={organization.login}
            width={72}
            height={72}
            className="rounded-full border-4 border-background mb-4"
          />
        )}
        <h1 className="heading !text-[32px]">{profile?.name ?? organization.login}</h1>
        {(profile?.description ?? organization.description) && (
          <p className="sub-heading">{profile?.description ?? organization.description}</p>
        )}
      </section>

      <section className="section-container">
        <div className="flex flex-wrap items-center gap-4 mb-8 text-14-normal">
          <Link
            href={profile?.htmlUrl ?? `https://github.com/${organization.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            GitHub profile <ExternalLink className="size-3.5" />
          </Link>
          {profile?.websiteUrl && (
            <Link
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary"
            >
              <Globe className="size-4" /> {profile.websiteUrl}
            </Link>
          )}
          {profile && (
            <span className="flex items-center gap-1.5">
              <Users className="size-4" /> {profile.followers.toLocaleString()} followers
            </span>
          )}
        </div>

        {members.length > 0 && (
          <div className="mb-8">
            <p className="text-16-medium mb-3">Public members</p>
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <Link
                  key={member.login}
                  href={member.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={member.login}
                >
                  <Image
                    src={member.avatarUrl}
                    alt={member.login}
                    width={40}
                    height={40}
                    className="rounded-full border border-border"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-16-medium mb-3">Showcased repositories</p>
        <ul className="card-grid">
          {repositories.length > 0 ? (
            repositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))
          ) : (
            <p className="no-result">No repositories from this organization showcased yet.</p>
          )}
        </ul>
      </section>
    </>
  );
};

export default Page;
