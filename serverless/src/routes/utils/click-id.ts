export type ClickIdType = 'gclid' | 'fbclid' | 'ttclid';

export function normalizeClickId(type: ClickIdType, value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  switch (type) {
    case 'gclid':
      return trimmed;
    case 'fbclid':
      return trimmed.toLowerCase();
    case 'ttclid':
      return trimmed.toLowerCase();
    default:
      return null;
  }
}

export function normalizeClickIds(input: {
  gclid?: unknown;
  fbclid?: unknown;
  ttclid?: unknown;
}): {
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
} {
  return {
    gclid: normalizeClickId('gclid', input.gclid),
    fbclid: normalizeClickId('fbclid', input.fbclid),
    ttclid: normalizeClickId('ttclid', input.ttclid),
  };
}
