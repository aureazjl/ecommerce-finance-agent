export const getDesignTokens = (mode = "light") => ({
  palette: {
    mode,
    primary: { main: "#157a62", light: "#55b79a", dark: "#0d5947", contrastText: "#fff" },
    secondary: { main: "#f2a46f" },
    background: { default: "#f7f9f8", paper: "#ffffff" },
    text: { primary: "#17362c", secondary: "#6d8279" },
    divider: "#dfe8e3",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@media (max-width:600px)': {
          'main .MuiTypography-h4 + .MuiTypography-root': { display: 'none' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          transition: "background-color 0.15s ease, border-color 0.15s ease",
          boxShadow: "none",
          fontWeight: 700,
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #dfe8e3",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(23,54,44,.025)",
          transition: "box-shadow 0.2s ease, background-color 0.2s ease",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiTableCell: { styleOverrides: { head: { backgroundColor: "#eef7f2", color: "#157a62", fontWeight: 700 } } },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif', h4: { letterSpacing: "-0.01em", fontWeight: 700, '@media (max-width:600px)': { fontSize: '1.2rem !important', lineHeight: 1.25, letterSpacing: '-0.01em', color: '#0d5947' } }, h6: { letterSpacing: 0, fontWeight: 700 } },
});
