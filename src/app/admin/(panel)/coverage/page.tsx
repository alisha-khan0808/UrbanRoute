import { ContentList } from "@/components/admin/ContentList";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { listEditable } from "@/lib/admin/data";
import { createRegionAction } from "../../actions";

const STATUS = { experience: "Prior experience", available: "Service available", hidden: "Hidden" } as const;

export default async function CoverageAdminPage() {
  const user = await requireUser("content.read");
  const items = await listEditable("region");
  return (
    <>
      <PageHeader
        title="Coverage"
        description="Region names, descriptions, marker positions and status. Markers are representative — do not imply endorsement."
      >
        {can(user.role, "content.edit") && (
          <form action={createRegionAction}>
            <Button type="submit" size="sm">
              Add region
            </Button>
          </form>
        )}
      </PageHeader>
      <ContentList
        type="region"
        basePath="/admin/coverage"
        sortable
        rows={items.map((i) => ({
          key: i.key,
          title: i.data.name,
          subtitle: `${i.data.island === "north" ? "North" : "South"} Island · ${STATUS[i.data.status]}`,
          status: i.status,
          updatedAt: i.updatedAt,
          updatedBy: i.updatedBy,
        }))}
      />
    </>
  );
}
