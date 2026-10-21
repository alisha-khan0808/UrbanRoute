import { EditorPage } from "@/components/admin/EditorPage";

export default function EditPagePage({ params }: { params: { slug: string } }) {
  return <EditorPage type="page" entityKey={params.slug} backHref="/admin/pages" backLabel="Pages" />;
}
