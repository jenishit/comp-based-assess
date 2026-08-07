export function parseRosterCsv(text: string): { name: string; email: string }[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));

  // Drop a header row like "name,email" — detected by the second column
  // not looking like an email address.
  if (rows.length > 0 && !rows[0][1]?.includes("@")) {
    rows.shift();
  }

  return rows
    .filter((cols) => cols.length >= 2 && cols[0] && cols[1]?.includes("@"))
    .map(([name, email]) => ({ name, email }));
}
