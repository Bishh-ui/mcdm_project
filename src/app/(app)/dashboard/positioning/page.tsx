import { PageHeader } from "@/components/ui/page-header";
import { PositioningEditor } from "@/components/positioning/positioning-editor";

export default function PositioningPage() {
  return (
    <>
      <PageHeader
        title="Positioning & Differentiation"
        description="Define the differentiation thesis, map proof points to claims, and log scope decisions with rationale."
      />
      <PositioningEditor />
    </>
  );
}
