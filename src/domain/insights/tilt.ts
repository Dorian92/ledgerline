export interface TiltSignal {
  id: string;
  title: string;
  severity: 'info' | 'warn';
}

export function detectTilt(_tradeCount: number): TiltSignal[] {
  return [];
}
