/** Junta classes, ignorando as vazias/falsas. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
