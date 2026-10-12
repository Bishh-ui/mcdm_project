/** Generate a short random ID. Good enough for localStorage phase. */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
