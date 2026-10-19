export function formatDate(value: string) {
  const input = value.trim();
  // Date-only values need a complete ISO timestamp. Appending Z directly to a
  // calendar date is nonstandard and produces Invalid Date in Safari/WebKit.
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(input)
    ? `${input}T00:00:00Z`
    : /(?:Z|[+-]\d{2}:\d{2})$/i.test(input)
      ? input
      : `${input}Z`;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
