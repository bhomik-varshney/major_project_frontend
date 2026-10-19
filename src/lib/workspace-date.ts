export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`));
}
