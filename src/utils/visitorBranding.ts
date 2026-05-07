export const VISITOR_FONT_OPTIONS = [
  {
    value: 'outfit',
    label: 'Outfit',
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    value: 'inter',
    label: 'Inter',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    value: 'manrope',
    label: 'Manrope',
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    value: 'dm-sans',
    label: 'DM Sans',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  {
    value: 'playfair',
    label: 'Playfair Display',
    fontFamily: "'Playfair Display', Georgia, serif"
  }
] as const;

export function getVisitorFontFamily(visitorFontFamily?: string): string {
  return VISITOR_FONT_OPTIONS.find((option) => option.value === visitorFontFamily)?.fontFamily
    ?? VISITOR_FONT_OPTIONS[0].fontFamily;
}
