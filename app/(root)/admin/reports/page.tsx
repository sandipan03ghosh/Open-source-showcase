import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import ReportRow from "@/components/admin/ReportRow";

export const metadata: Metadata = { title: "Admin · Reports" };

const Page = async () => {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      reporter: { select: { username: true } },
      repository: { select: { fullName: true, githubOwnerLogin: true, name: true } },
    },
  });

  return (
    <ul className="space-y-3">
      {reports.length > 0 ? (
        reports.map((report) => <ReportRow key={report.id} report={report} />)
      ) : (
        <p className="no-result">No reports yet.</p>
      )}
    </ul>
  );
};

export default Page;
