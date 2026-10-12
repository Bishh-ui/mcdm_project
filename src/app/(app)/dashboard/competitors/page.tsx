import { PageHeader } from "@/components/ui/page-header";
import { CompetitorMatrix } from "@/components/competitors/competitor-matrix";

export default function CompetitorsPage() {
  return (
    <>
      <PageHeader
        title="Competitor Capability Matrix"
        description="Score competitors across capabilities on a 1-5 scale. Identify gaps and whitespace opportunities."
      />
      <CompetitorMatrix />
    </>
  );
}
