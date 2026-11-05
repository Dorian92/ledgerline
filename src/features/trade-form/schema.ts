import { z } from 'zod';

export const tradeFormSchema = z.object({
  symbol: z.string().min(1, 'Symbol required'),
  direction: z.enum(['long', 'short']),
  entry: z.string().min(1, 'Entry required'),
  exit: z.string().optional(),
  quantity: z.string().min(1, 'Size required'),
  stop: z.string().optional(),
  fees: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export type TradeFormValues = z.infer<typeof tradeFormSchema>;
