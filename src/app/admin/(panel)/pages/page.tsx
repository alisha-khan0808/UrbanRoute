import { ContentList } from "@/components/admin/ContentList";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireUser } from "@/lib/auth/session";
import { listEditable } from "@/lib/admin/data";

export default async function PagesAdminPage() {
  await requireUser("content.read");
  const items = await listEditable("page");
  return (
    <>
      <PageHeader
        title="Pages"
        description="Homepage, about, contact, coverage and privacy content. Add, remove and reorder sections, then preview and publish."
      />
      <ContentList
        type="page"
        basePath="/admin/pages"
        rows={items.map((i) => ({
          key: i.key,
          title: i.data.title,
          subtitle: i.key === "home" ? "/" : `/${i.key}`,
          status: i.status,
          updatedAt: i.updatedAt,
          updatedBy: i.updatedBy,
        }))}
      />
    </>
  );
}
