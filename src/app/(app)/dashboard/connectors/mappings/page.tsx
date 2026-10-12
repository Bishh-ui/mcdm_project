import { PageHeader } from "@/components/ui/page-header";
import { SignalMapping } from "@/components/connectors/signal-mapping";

export default function MappingsPage() {
  return (
    <>
      <PageHeader
        title="Signal-to-Criteria Mapping"
        description="Configure how incoming data signals from Shopify and GA4 map to TOPSIS criteria. Set aggregation rules and refresh frequency."
      />
      <SignalMapping />
    </>
  );
}
