export const SITE_IMAGE_SLOTS = [
  'hero',
  'service_ventana',
  'service_split',
  'service_toneladas',
  'technician',
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number];

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function isSiteImageSlot(value: string): value is SiteImageSlot {
  return (SITE_IMAGE_SLOTS as readonly string[]).includes(value);
}

export function extForMime(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}
