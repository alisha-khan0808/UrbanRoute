import { ContentList } from "@/components/admin/ContentList";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireUser } from "@/lib/auth/session";
import { listEditable } from "@/lib/admin/data";

export default async function ServicesAdminPage() {
  await requireUser("content.read");
  const items = await listEditable("service");
  return (
    <>
      <PageHeader
        title="Services"
        description="Edit the seven services: scope, deliverables, process steps, FAQs, related services, CTA labels and SEO. Order controls the menu and hotspot order."
      />
      <ContentList
        type="service"
        basePath="/admin/services"
        sortable
        rows={items.map((i) => ({
          key: i.key,
          title: `${i.data.number} — ${i.data.title}`,
          subtitle: `/services/${i.key}`,
          status: i.status,
          updatedAt: i.updatedAt,
          updatedBy: i.updatedBy,
        }))}
      />
    </>
  );
}
