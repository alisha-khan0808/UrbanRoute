import { EditorPage } from "@/components/admin/EditorPage";

export default function EditRegionPage({ params }: { params: { id: string } }) {
  return <EditorPage type="region" entityKey={params.id} backHref="/admin/coverage" backLabel="Coverage" />;
}
