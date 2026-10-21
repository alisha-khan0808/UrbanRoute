import { EditorPage } from "@/components/admin/EditorPage";

export default function SettingsAdminPage() {
  return <EditorPage type="settings" entityKey="site" title="Site settings" description="Company name, contact details and service area shown across the site." />;
}
