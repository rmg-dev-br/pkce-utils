export const sha256 = async (value: string): Promise<ArrayBuffer> =>
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

export const generateNonce = async () => {
  const hash = await sha256(crypto.getRandomValues(new Uint32Array(4)).toString());
  const hashArray = Array.from(new Uint8Array(hash));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};