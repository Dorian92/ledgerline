import type { IdGenerator } from './ids';

export function testIds(): IdGenerator {
  let n = 0;
  return {
    randomUUID: () => {
      n += 1;
      return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    },
  };
}
