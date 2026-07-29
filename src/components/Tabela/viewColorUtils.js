/**
 * Stable accent colors for calendar/timeline items (slightly vivid, mid saturation).
 */

const ACCENT_PALETTE = [
  { bg: 'hsl(152 44% 70%)', text: 'hsl(152 40% 20%)' }, // mint
  { bg: 'hsl(210 48% 72%)', text: 'hsl(210 42% 24%)' }, // sky
  { bg: 'hsl(280 38% 74%)', text: 'hsl(280 34% 26%)' }, // lavender
  { bg: 'hsl(22 52% 72%)', text: 'hsl(22 48% 24%)' },  // peach
  { bg: 'hsl(340 45% 74%)', text: 'hsl(340 42% 28%)' }, // blush
  { bg: 'hsl(175 42% 70%)', text: 'hsl(175 40% 22%)' }, // aqua
  { bg: 'hsl(48 55% 72%)', text: 'hsl(48 45% 24%)' },  // cream
  { bg: 'hsl(230 42% 74%)', text: 'hsl(230 38% 26%)' }, // periwinkle
  { bg: 'hsl(8 48% 74%)', text: 'hsl(8 44% 26%)' },    // coral soft
  { bg: 'hsl(195 46% 72%)', text: 'hsl(195 42% 24%)' }, // soft cyan
];

/**
 * Simple stable string hash → non-negative int.
 * @param {*} key
 * @returns {number}
 */
export function hashItemKey(key) {
  const str = key == null ? '' : String(key);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * @param {*} key - item identity (row key, codigo, etc.)
 * @returns {{ bg: string, text: string, softBg: string, border: string }}
 */
export function getItemAccentColor(key) {
  const idx = hashItemKey(key) % ACCENT_PALETTE.length;
  const { bg, text } = ACCENT_PALETTE[idx];
  return {
    bg,
    text,
    softBg: `color-mix(in srgb, ${bg} 70%, transparent)`,
    border: `color-mix(in srgb, ${text} 45%, ${bg})`,
  };
}
