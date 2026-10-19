const fields = {
  Education: [
    "location",
    "start_year",
    "end_year",
    "expected_graduation",
    "grade",
    "specialization",
  ],
  Experience: [
    "location",
    "start_date",
    "end_date",
    "current_status",
    "responsibilities",
    "achievements",
    "technologies",
  ],
  Project: ["technologies", "role", "period", "links"],
};
const lists = new Set(["responsibilities", "achievements", "technologies", "links"]);
export function ResumeDetails({
  kind,
  index,
  value,
  onChange,
}: {
  kind: keyof typeof fields;
  index: number;
  value: object;
  onChange: (field: string, value: string | string[]) => void;
}) {
  return (
    <details className="mt-4 rounded-lg border border-border p-3">
      <summary className="cursor-pointer text-xs text-muted-foreground">
        Additional {kind.toLowerCase()} details {index + 1}
      </summary>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        {fields[kind].map((field) => {
          const item = (value as Record<string, string | string[] | undefined>)[field];
          const label = `${kind} ${field.replaceAll("_", " ")} ${index + 1}`;
          const multiline = ["responsibilities", "achievements", "links"].includes(field);
          const text = Array.isArray(item) ? item.join(multiline ? "\n" : ", ") : item || "";
          const change = (updated: string) =>
            onChange(
              field,
              lists.has(field)
                ? updated
                    .split(multiline ? "\n" : ",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : updated,
            );
          return (
            <label key={field} className={`career-field ${multiline ? "sm:col-span-2" : ""}`}>
              <span>{label}</span>
              {multiline ? (
                <textarea
                  rows={3}
                  value={text}
                  maxLength={6000}
                  onChange={(e) => change(e.target.value)}
                />
              ) : (
                <input
                  value={text}
                  maxLength={field === "technologies" ? 2000 : 160}
                  onChange={(e) => change(e.target.value)}
                />
              )}
              {lists.has(field) && (
                <small>
                  {multiline
                    ? "One explicitly supported entry per line."
                    : "Separate explicitly supported technologies with commas."}
                </small>
              )}
            </label>
          );
        })}
      </div>
    </details>
  );
}
