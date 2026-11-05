import Papa from 'papaparse';

const MAX_ROWS = 50_000;
const MAX_CHARS = 10 * 1024 * 1024;

export function parseCsv(
  text: string,
):
  | { header: string[]; rows: string[][]; delimiter: string }
  | { error: 'too_many_rows' | 'too_large' } {
  if (text.length > MAX_CHARS) {
    return { error: 'too_large' };
  }
  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
  });
  const all = parsed.data.filter((r) => r.some((c) => c.trim() !== ''));
  if (all.length === 0) {
    return { header: [], rows: [], delimiter: ',' };
  }
  const header = all[0]!.map((h) => h.replace(/^\uFEFF/, '').trim());
  const rows = all.slice(1);
  if (rows.length > MAX_ROWS) {
    return { error: 'too_many_rows' };
  }
  return { header, rows, delimiter: parsed.meta.delimiter ?? ',' };
}
