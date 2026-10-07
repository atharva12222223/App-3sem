/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // High-contrast outdoor palette (PMSVY / civic-tech inspired)
        vendor: {
          50: "#fff7ed",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        civic: {
          50: "#eff6ff",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e3a5f",
        },
        verified: {
          500: "#16a34a",
          600: "#15803d",
        },
      },
      fontSize: {
        // Larger base sizes for low-vision / outdoor readability
        "touch": ["1.125rem", { lineHeight: "1.6" }],
      },
      minHeight: {
        "touch-target": "48px",
      },
    },
  },
  plugins: [],
};
