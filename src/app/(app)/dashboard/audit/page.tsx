import { PageHeader } from "@/components/ui/page-header";
import { AuditLogViewer } from "@/components/audit/audit-log-viewer";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Immutable record of every data mutation. Who changed what, when, and the previous value."
      />
      <AuditLogViewer />
    </>
  );
}
