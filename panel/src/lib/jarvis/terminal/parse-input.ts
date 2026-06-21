export type ParsedInput =
  | { kind: "empty" }
  | { kind: "nl"; text: string }
  | { kind: "slash"; name: string; args: string[]; raw: string };

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" };
  if (trimmed.startsWith("/")) {
    const parts = trimmed.slice(1).split(/\s+/).filter(Boolean);
    const name = (parts.shift() ?? "").toLowerCase();
    return { kind: "slash", name, args: parts, raw: trimmed };
  }
  return { kind: "nl", text: trimmed };
}
