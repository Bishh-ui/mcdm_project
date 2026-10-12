import { PageHeader } from "@/components/ui/page-header";
import { ShopifyConnector } from "@/components/connectors/shopify-connector";

export default function ConnectorsPage() {
  return (
    <>
      <PageHeader
        title="Shopify Integration"
        description="Connect your Shopify store to sync products and push TOPSIS rankings for optimized product display."
      />
      <ShopifyConnector />
    </>
  );
}
