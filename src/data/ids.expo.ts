import * as Crypto from 'expo-crypto';

import type { IdGenerator } from './ids';

export const expoIds: IdGenerator = {
  randomUUID: () => Crypto.randomUUID(),
};
