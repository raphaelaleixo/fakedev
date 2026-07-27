/**
 * Ranking for the composer's key autocomplete.
 *
 * Prefix matches come first because that's what typing feels like it should do:
 * "d" should offer `display` and `direction`, not `border-radius`. Substring
 * matches still follow, so `background-color` stays reachable by typing
 * "color" — which matters when the property you want is a longhand you only
 * half-remember.
 */
export function rankSuggestions(query: string, pool: string[], limit = 60): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return pool;

  const prefix: string[] = [];
  const contains: string[] = [];

  for (const item of pool) {
    const candidate = item.toLowerCase();
    if (candidate.startsWith(needle)) prefix.push(item);
    else if (candidate.includes(needle)) contains.push(item);
  }

  prefix.sort();
  contains.sort();
  return [...prefix, ...contains].slice(0, limit);
}
