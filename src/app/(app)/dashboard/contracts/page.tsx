import { PageHeader } from "@/components/ui/page-header";
import { ContractsManager } from "@/components/contracts/contracts-manager";

export default function ContractsPage() {
  return (
    <>
      <PageHeader
        title="Data Contracts"
        description="Define JSON schemas for each signal type. Validate incoming data against contracts before it feeds into TOPSIS criteria."
      />
      <ContractsManager />
    </>
  );
}
