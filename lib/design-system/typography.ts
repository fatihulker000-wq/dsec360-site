export const typography = {
  fontFamily:
    "Inter, Geist, 'Segoe UI', Arial, Helvetica, sans-serif",

  display: {
    xl: 40,
    lg: 32,
    md: 28,
  },

  heading: {
    xl: 24,
    lg: 20,
    md: 18,
  },

  body: {
    lg: 16,
    md: 15,
    sm: 14,
  },

  caption: 12,

  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
} as const;

export default typography;