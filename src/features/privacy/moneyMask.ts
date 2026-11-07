/** Display substitute for masked currency and quote-denominated numbers. */
export const MONETARY_MASK = '••••';

export type MonetaryFieldKey = 'entry' | 'exit' | 'quantity' | 'stop' | 'fees';

export const MONETARY_FORM_FIELDS: MonetaryFieldKey[] = [
  'entry',
  'exit',
  'quantity',
  'stop',
  'fees',
];

export function maskMonetaryDisplay(hidden: boolean, visible: string): string {
  return hidden ? MONETARY_MASK : visible;
}

export function monetaryAccessibilityLabel(
  hidden: boolean,
  label: string,
  visible: string,
): string {
  if (hidden) {
    return `${label} hidden`;
  }
  return `${label} ${visible}`;
}
