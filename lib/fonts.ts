import { Montserrat, Cormorant } from 'next/font/google';

export const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  adjustFontFallback: true,
});

// Replacing the local Correiria font with Cormorant from Google Fonts
// as it has similar decorative characteristics and supports Cyrillic
export const correiria = Cormorant({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-correiria',
  display: 'swap',
  fallback: ['system-ui', 'arial', 'serif'],
  adjustFontFallback: true,
});