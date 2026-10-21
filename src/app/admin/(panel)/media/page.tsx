/* eslint-disable @next/next/no-img-element */
import { FileText } from "lucide-react";
import { ActionButton, ActionForm } from "@/components/admin/controls";
import { CopyButton } from "@/components/admin/CopyButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getStore } from "@/lib/data/store";
import { deleteMediaAction, replaceMediaAction, updateMediaAltAction, uploadMediaAction } from "../../actions";

export default async function MediaPage() {
  const user = await requireUser("content.read");
  const store = await getStore();
  const media = await store.listMedia();
  const canEdit = can(user.role, "media.edit");
  const canDelete = can(user.role, "media.delete");

  return (
    <>
      <PageHeader title="Media library" description="Upload images and documents for use in pages and SEO previews. Always add descriptive alt text." />

      {canEdit && (
        <ActionForm action={uploadMediaAction} submitLabel="Upload" className="card mb-6 grid gap-4 p-5 sm:grid-cols-2" resetOnSuccess>
          <div>
            <label htmlFor="file" className="field-label">
              File (JPG, PNG, WEBP or PDF · max 10 MB)
            </label>
            <input id="file" name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" required className="field" />
          </div>
          <div>
            <label htmlFor="alt" className="field-label">
              Alt text
            </label>
            <input id="alt" name="alt" className="field" placeholder="Describe the image for screen readers" />
          </div>
        </ActionForm>
      )}

      {media.length === 0 ? (
        <p className="card p-8 text-center text-ink-muted">No media yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="card overflow-hidden">
              <div className="flex aspect-video items-center justify-center bg-paper">
                {m.contentType.startsWith("image/") ? (
                  <img src={m.url} alt={m.altText} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-10 w-10 text-ink-muted" aria-hidden />
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{m.fileName}</p>
                  <CopyButton text={m.url} />
                </div>
                {canEdit && (
                  <>
                    <ActionForm action={updateMediaAltAction.bind(null, m.id)} submitLabel="Save alt" variant="secondary">
                      <label htmlFor={`alt-${m.id}`} className="sr-only">
                        Alt text for {m.fileName}
                      </label>
                      <input id={`alt-${m.id}`} name="alt" defaultValue={m.altText} className="field" placeholder="Alt text" />
                    </ActionForm>
                    <ActionForm action={replaceMediaAction.bind(null, m.id)} submitLabel="Replace file" variant="secondary">
                      <label htmlFor={`file-${m.id}`} className="sr-only">
                        Replacement for {m.fileName}
                      </label>
                      <input id={`file-${m.id}`} name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" required className="field text-sm" />
                    </ActionForm>
                  </>
                )}
                {canDelete && (
                  <ActionButton action={deleteMediaAction.bind(null, m.id)} confirm={`Delete ${m.fileName}? This cannot be undone.`} variant="danger">
                    Remove
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
