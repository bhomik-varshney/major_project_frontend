import { useEffect, useState } from "react";

export function PrivateDocumentPreview({
  identity,
  load,
  label,
}: {
  identity: string;
  load: () => Promise<Blob>;
  label: string;
}) {
  const [url, setURL] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let objectURL = "";
    setURL("");
    setError(false);
    void load()
      .then((blob) => {
        if (active) {
          objectURL = URL.createObjectURL(blob);
          setURL(objectURL);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
    // The identity binds the authenticated resource; the inline loader is not a resource change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);
  return error ? (
    <p role="alert">Private preview could not load. Refresh this version and try again.</p>
  ) : url ? (
    <img className="mx-auto max-h-[1150px] max-w-full rounded bg-white" src={url} alt={label} />
  ) : (
    <p role="status">Loading private PDF preview…</p>
  );
}
