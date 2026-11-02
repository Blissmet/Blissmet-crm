const SIGNATURES: Record<string, Array<{ offset: number; bytes: number[] }>> = {
  "application/pdf": [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }],
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  "application/msword": [
    {
      offset: 0,
      bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    },
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
    { offset: 0, bytes: [0x50, 0x4b, 0x05, 0x06] },
  ],
};

/**
 * Confirms the leading bytes of an uploaded file match the MIME type the
 * browser declared. Prevents an executable or unrelated payload from being
 * stored under a trusted extension.
 */
export function matchesDeclaredFileType(
  bytes: Uint8Array,
  mimeType: string
): boolean {
  const signatures = SIGNATURES[mimeType];
  if (!signatures) return false;

  return signatures.some(({ offset, bytes: expected }) =>
    expected.every((value, index) => bytes[offset + index] === value)
  );
}
