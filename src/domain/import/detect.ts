import type { ImportAdapter } from './types';

export function detectAdapter(
  header: string[],
  adapters: ImportAdapter[],
):
  | { adapter: ImportAdapter }
  | { error: 'unknown_format'; closest?: { formatId: string; missing: string[] } } {
  const matches = adapters.filter((a) =>
    a.headerSignature.required.every((col) => header.includes(col)),
  );
  if (matches.length === 0) {
    const closest = adapters[0];
    return {
      error: 'unknown_format',
      closest: closest
        ? {
            formatId: closest.formatId,
            missing: closest.headerSignature.required.filter((c) => !header.includes(c)),
          }
        : undefined,
    };
  }
  if (matches.length > 1) {
    matches.sort(
      (a, b) =>
        (b.headerSignature.optional?.filter((c) => header.includes(c)).length ?? 0) -
        (a.headerSignature.optional?.filter((c) => header.includes(c)).length ?? 0),
    );
  }
  return { adapter: matches[0]! };
}
