import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export function fingerprintRow(formatId: string, identity: string): string {
  const payload = utf8ToBytes(`${formatId}\u001f${identity}`);
  return bytesToHex(sha256(payload));
}

export function hashFile(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)));
}
