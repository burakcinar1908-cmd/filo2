// sleek tasarim sistemi — 8pt grid uzerine radius/motion/golge token'lari
// (palet colors.ts'de kalir; burasi sekil ve hareket katmani)

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
} as const;
