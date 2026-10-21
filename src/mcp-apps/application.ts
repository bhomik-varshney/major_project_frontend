import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ApplicationSurface } from "../services/api/application-types";
import type { PreviewField, RepeatedEntry } from "../services/api/application-preview-types";
const root = document.getElementById("app")!;
const app = new App(
  { name: "ascendra-application-review", version: "1.1.0" },
  { availableDisplayModes: ["inline"] },
  { autoResize: false },
);
let state: ApplicationSurface;
let fingerprint = "";
let mode = "preview";
const style = document.createElement("style");
style.textContent = `*{box-sizing:border-box}body{margin:0;padding:20px;background:#111013;color:#efe9ed;font:14px system-ui;line-height:1.6}h2{font-size:22px}h3{font-size:18px}p,small{color:#b7aab3}label{display:block;margin-top:14px}input,textarea,select,button{font:inherit;color:inherit;background:#19161b;border:1px solid #55424c;border-radius:9px;padding:10px;max-width:100%}input:not([type=checkbox]),textarea,select{width:100%}textarea{min-height:120px}button{margin:8px 8px 8px 0;cursor:pointer}button:disabled{opacity:.5}summary{cursor:pointer}section,article{border:1px solid #44313b;border-radius:12px;padding:16px;margin-top:14px;min-width:0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}.proof{font-size:11px;color:#b7aab3}.value{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#e8a8ba;overflow-wrap:anywhere}nav{position:sticky;top:0;background:#111013;padding:6px 0}button[aria-pressed=true]{background:#7b2138}#notice{color:#f0b9c6}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}`;
document.head.append(style);
const words = (value: string) => value.replaceAll("_", " ");
function text(tag: string, value: string, parent: HTMLElement, className = "") {
  const node = document.createElement(tag);
  node.textContent = value;
  node.className = className;
  parent.append(node);
  return node;
}
function link(label: string, url: string, parent: HTMLElement) {
  if (!/^https?:\/\//i.test(url)) return;
  const node = document.createElement("a");
  node.href = url;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  node.referrerPolicy = "no-referrer";
  node.textContent = label;
  parent.append(node);
}
function entries(values: RepeatedEntry[], parent: HTMLElement) {
  if (values.length)
    text(
      "p",
      "Confirmed profile reference. Only reviewed form fields are sent during prefill.",
      parent,
      "proof",
    );
  const grid = text("div", "", parent, "grid");
  for (const entry of values) {
    const card = text("article", "", grid);
    text("h4", entry.title, card);
    if (entry.subtitle) text("p", entry.subtitle, card);
    for (const [key, value] of Object.entries(entry.details))
      text("p", `${key}: ${value}`, card, "proof");
    for (const bullet of entry.bullets) text("p", `• ${bullet}`, card, "value");
    for (const item of entry.links) link(`${item.label}: ${item.url}`, item.url, card);
  }
}
function render(data: ApplicationSurface, force = false) {
  state = data;
  const next = JSON.stringify({
    form: data.form,
    fields: data.fields,
    preview: data.preview,
    actions: data.actions,
  });
  if (!force && next === fingerprint) return;
  fingerprint = next;
  root.replaceChildren();
  text("h2", "Application MCP review", root);
  const preview = data.preview;
  if (!preview) {
    text("p", "Generate a readable application preview in the host workspace.", root);
    return;
  }
  text("p", `${preview.is_mock ? "Mock mode · " : ""}${preview.title} — ${preview.company}`, root);
  text("p", `Source: ${preview.source || "Not provided"}`, root);
  if (preview.application_url)
    link(`Application URL: ${preview.application_url}`, preview.application_url, root);
  text(
    "p",
    "Review and edit locally. Field approval, uploads and submission acknowledgements remain in the host workspace. Nothing here submits an application.",
    root,
  );
  const nav = text("nav", "", root);
  for (const view of ["preview", "form"]) {
    const button = text(
      "button",
      view === "preview" ? "Preview application" : "Edit fields",
      nav,
    ) as HTMLButtonElement;
    button.type = "button";
    button.setAttribute("aria-pressed", String(mode === view));
    button.onclick = () => {
      mode = view;
      render(state, true);
    };
  }
  const values: Record<string, { value: string | boolean | string[] | null; approved: boolean }> =
    {};
  for (const section of preview.sections) {
    const box = text("section", "", root);
    const details = document.createElement("details");
    details.open =
      section.entries.length > 0 ||
      section.links.length > 0 ||
      section.fields.some(
        (f) => f.required || (f.display_value !== null && f.display_value !== ""),
      );
    box.append(details);
    text("summary", section.label, details);
    entries(section.entries, details);
    for (const item of section.links) {
      const row = text("p", "", details);
      link(`${item.label}${item.primary ? " · primary" : ""}: ${item.url}`, item.url, row);
    }
    for (const field of section.fields) {
      const spec = data.form.fields.find((s) => s.id === field.field_id);
      if (!spec) continue;
      const source = data.fields.find((f) => f.id === spec.id);
      if (!source) continue;
      const card = text("article", "", details);
      let row = card;
      if (
        mode === "form" &&
        !field.required &&
        (field.display_value === null || field.display_value === "")
      ) {
        const optional = document.createElement("details");
        text("summary", `Add optional ${field.label}`, optional);
        card.append(optional);
        row = optional;
      }
      text("h4", field.label + (field.required ? " *" : ""), row);
      if (mode === "preview" || ["file", "unsupported"].includes(spec.type)) {
        text(
          "p",
          field.display_value === null || field.display_value === ""
            ? field.reason || "Not provided"
            : Array.isArray(field.display_value)
              ? field.display_value.join(", ")
              : typeof field.display_value === "boolean"
                ? field.display_value
                  ? "Yes"
                  : "No"
                : field.display_value,
          row,
          "value",
        );
      } else {
        values[spec.id] = { value: field.display_value, approved: source.approved };
        let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (["select", "radio", "multiselect"].includes(spec.type)) {
          const select = document.createElement("select");
          select.multiple = spec.type === "multiselect";
          if (!select.multiple) {
            const empty = document.createElement("option");
            empty.value = "";
            empty.textContent = "Choose…";
            select.append(empty);
          }
          for (const value of spec.options) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = Array.isArray(field.display_value)
              ? field.display_value.includes(value)
              : field.display_value === value;
            select.append(option);
          }
          input = select;
        } else if (spec.type === "textarea") {
          const area = document.createElement("textarea");
          area.value = String(field.display_value ?? "");
          input = area;
        } else {
          const element = document.createElement("input");
          element.type = spec.type;
          if (spec.type === "checkbox") element.checked = field.display_value === true;
          else element.value = String(field.display_value ?? "");
          input = element;
        }
        input.setAttribute("aria-label", spec.label);
        input.disabled = !data.actions.includes("review_application");
        input.id = spec.id;
        row.append(input);
        input.oninput = () => {
          values[spec.id]!.value =
            input instanceof HTMLSelectElement && input.multiple
              ? Array.from(input.selectedOptions, (o) => o.value)
              : input instanceof HTMLInputElement && input.type === "checkbox"
                ? input.checked
                : input.value;
          values[spec.id]!.approved = false;
        };
      }
      text(
        "p",
        `${words(field.status)} · ${field.source_label} · ${Math.round(field.confidence * 100)}% confidence · ${field.approved ? "Reviewed" : "Confirmation required"}`,
        row,
        "proof",
      );
      if (field.answer?.detailed) {
        const proof = document.createElement("details");
        text("summary", "Detailed draft and evidence", proof);
        text("p", field.answer.detailed, proof, "value");
        text("p", field.answer.evidence.join("; "), proof, "proof");
        text("p", field.answer.reason || "Generated draft. Review before use.", proof, "proof");
        row.append(proof);
      }
    }
  }
  const docs = text("section", "", root);
  text("h3", "Selected documents", docs);
  if (!preview.documents.length)
    text("p", "No documents selected. Use the host document selector.", docs);
  for (const item of preview.documents)
    text(
      "p",
      `${item.label} · ${words(item.role)} · ${item.size_bytes} bytes · ${item.approved ? "Reviewed" : "Review needed"}`,
      docs,
    );
  if (mode === "form") {
    const save = text("button", "Save local draft from MCP app", root) as HTMLButtonElement;
    save.type = "button";
    save.disabled = !data.actions.includes("review_application");
    const notice = text("p", "", root);
    notice.id = "notice";
    notice.setAttribute("role", "status");
    save.onclick = () => {
      save.disabled = true;
      void app
        .request(
          {
            method: "tools/call",
            params: {
              name: "review_application",
              arguments: { expected_revision: state.revision, fields: values },
            },
          },
          CallToolResultSchema,
        )
        .then((result) => {
          notice.textContent = result.isError
            ? "Could not save. Refresh the host workspace and review its current state."
            : "Saved locally. Review and approve in the host workspace.";
        })
        .catch(() => {
          notice.textContent = "Could not save. Use the host review form.";
        })
        .finally(() => {
          save.disabled = false;
        });
    };
  }
}
app.addEventListener("toolresult", (result: unknown) => {
  const response = result as { content?: { type: string; text?: string }[] };
  try {
    const value = response.content?.find((c) => c.type === "text")?.text;
    if (value) render(JSON.parse(value) as ApplicationSurface);
  } catch {
    root.textContent = "Invalid application preview. Use the host workspace.";
  }
});
void app.connect(new PostMessageTransport(window.parent, window.parent));
