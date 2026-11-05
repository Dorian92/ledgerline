export function decodeCsvBytes(
  bytes: Uint8Array,
):
  | { text: string; encoding: 'utf-8' | 'utf-8-bom' | 'utf-16le' }
  | { error: 'unsupported_encoding' } {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder('utf-8').decode(bytes.slice(3)), encoding: 'utf-8-bom' };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes.slice(2)), encoding: 'utf-16le' };
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'utf-8' };
  } catch {
    return { error: 'unsupported_encoding' };
  }
}
