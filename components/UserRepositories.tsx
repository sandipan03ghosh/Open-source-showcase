import { prisma } from "@/lib/prisma";
import RepositoryCard from "@/components/RepositoryCard";

const UserRepositories = async ({ userId }: { userId: string }) => {
  const repositories = await prisma.repository.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      fullName: true,
      description: true,
      githubOwnerLogin: true,
      githubOwnerAvatarUrl: true,
      stars: true,
      forks: true,
      license: true,
      topics: true,
      technologies: true,
      viewCount: true,
      createdAt: true,
    },
  });

  if (repositories.length === 0) {
    return <p className="no-result">No repositories showcased yet.</p>;
  }

  return (
    <>
      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} />
      ))}
    </>
  );
};

export default UserRepositories;
