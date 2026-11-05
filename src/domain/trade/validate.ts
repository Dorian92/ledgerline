import { dec, isPos, isZero, type Dec } from '../money/dec';
import type { QuoteCurrency } from '../money/types';
import type { AccountQuote, TradeInput, ValidationResult } from './types';

export function validateTradeInput(input: TradeInput, account: AccountQuote): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  if (!input.symbol.trim()) {
    errors.symbol = 'symbol_required';
  }
  if (input.quoteAsset !== account.quoteCurrency) {
    errors.quote = 'quote_mismatch';
  }
  if (!isPos(input.entryPrice)) {
    errors.entry = 'entry_positive';
  }
  if (!isPos(input.quantity)) {
    errors.quantity = 'qty_positive';
  }
  if (input.stopPrice !== null && !isPos(input.stopPrice)) {
    errors.stop = 'stop_positive';
  }
  if (input.exitPrice !== null && !isPos(input.exitPrice)) {
    errors.exit = 'exit_positive';
  }
  if (input.closedAt !== null && input.closedAt < input.openedAt) {
    errors.closedAt = 'closed_before_opened';
  }
  if (input.closedAt !== null && input.exitPrice === null) {
    errors.exit = 'close_time_without_exit';
  }
  if (input.closedAt === null && input.exitPrice !== null) {
    errors.closedAt = 'exit_without_close_time';
  }
  if (input.notes.length > 4000) {
    errors.notes = 'notes_too_long';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function accountFromQuote(quoteCurrency: QuoteCurrency): AccountQuote {
  return { quoteCurrency };
}
