import colors from "./colors";
import spacing from "./spacing";
import typography from "./typography";

export const theme = {
  colors,
  spacing,
  typography,

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    round: 999,
  },

  shadow: {
    sm: "0 2px 8px rgba(0,0,0,.05)",
    md: "0 8px 24px rgba(0,0,0,.08)",
    lg: "0 16px 40px rgba(0,0,0,.12)",
  },

  transition: {
    normal: "all .25s ease",
    fast: "all .15s ease",
  },
};

export default theme;