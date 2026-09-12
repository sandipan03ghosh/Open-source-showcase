import { redirect } from "next/navigation";

import { auth } from "@/auth";
import RepositoryForm from "@/components/RepositoryForm";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <>
      <section className="hero-container !min-h-[200px]">
        <h1 className="heading">Showcase a repository</h1>
        <p className="sub-heading">
          Connect a public GitHub repository — we automatically pull its README, languages,
          topics, license, and stats.
        </p>
      </section>

      <RepositoryForm />
    </>
  );
};

export default Page;
