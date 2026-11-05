import { describe, it, expect } from '@jest/globals';

import { qk } from '../keys';

describe('query keys', () => {
  it('changes when mode changes', () => {
    expect(qk.trades('demo', 'a1')).not.toEqual(qk.trades('real', 'a1'));
  });
});
