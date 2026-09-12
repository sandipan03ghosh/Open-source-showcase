import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import RepositoryModerationRow from "@/components/admin/RepositoryModerationRow";

export const metadata: Metadata = { title: "Admin · Repositories" };

const Page = async () => {
  const session = await auth();
  const canDelete = session?.user.role === "ADMIN";

  const repositories = await prisma.repository.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      githubOwnerLogin: true,
      name: true,
      stars: true,
      isFeatured: true,
      isArchived: true,
      owner: { select: { username: true } },
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-14-normal">
            <th className="py-2 pr-4 font-medium">Repository</th>
            <th className="py-2 pr-4 font-medium">Stars</th>
            <th className="py-2 pr-4 font-medium">Featured</th>
            <th className="py-2 pr-4 font-medium">Archived</th>
            <th className="py-2 pr-4 font-medium">Delete</th>
          </tr>
        </thead>
        <tbody>
          {repositories.map((repository) => (
            <RepositoryModerationRow
              key={repository.id}
              repository={repository}
              canDelete={canDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
