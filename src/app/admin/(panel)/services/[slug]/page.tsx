import { EditorPage } from "@/components/admin/EditorPage";

export default function EditServicePage({ params }: { params: { slug: string } }) {
  return <EditorPage type="service" entityKey={params.slug} backHref="/admin/services" backLabel="Services" />;
}
