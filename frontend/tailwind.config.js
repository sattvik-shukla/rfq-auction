export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#fffaf3",
          100: "#fff2df",
          200: "#f8e0c2",
          300: "#e9c9a9",
          400: "#cba985",
          500: "#a98166",
          600: "#875f4e",
          700: "#68463d",
          800: "#4b312d",
          900: "#321f1e",
          950: "#1f1212",
        },
        accent: {
          DEFAULT: "#d97745",
          light: "#eb9965",
          dark: "#bc6437",
          subtle: "rgba(217, 119, 69, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "sans-serif"],
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 2s infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        glow: "0 18px 36px rgba(217, 119, 69, 0.2)",
        "glow-lg": "0 24px 56px rgba(217, 119, 69, 0.24)",
      },
    },
  },
  plugins: [],
};
