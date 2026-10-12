import { PageHeader } from "@/components/ui/page-header";
import { CriteriaManager } from "@/components/criteria/criteria-manager";

export default function CriteriaPage() {
  return (
    <>
      <PageHeader
        title="Criteria Taxonomy"
        description="Define the decision criteria used by the TOPSIS engine. Organize by category, set benefit/cost type, and assign weights."
      />
      <CriteriaManager />
    </>
  );
}
