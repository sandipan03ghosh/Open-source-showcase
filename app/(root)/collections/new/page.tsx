import { redirect } from "next/navigation";

import { auth } from "@/auth";
import CollectionForm from "@/components/CollectionForm";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/collections");

  return (
    <>
      <section className="hero-container !min-h-[200px]">
        <h1 className="heading">New collection</h1>
      </section>

      <CollectionForm />
    </>
  );
};

export default Page;
