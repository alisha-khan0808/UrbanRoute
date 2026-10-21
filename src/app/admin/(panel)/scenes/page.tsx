import { EditorPage } from "@/components/admin/EditorPage";

export default function ScenesAdminPage() {
  return (
    <EditorPage
      type="scene"
      entityKey="home-world"
      title="3D scenes"
      description="Configure the prebuilt 3D homepage: enable/disable, intro animation, default quality, approved camera presets and hotspot labels/destinations. Geometry itself is not editable here."
    />
  );
}
