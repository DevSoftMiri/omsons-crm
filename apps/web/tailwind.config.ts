import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f7f7f7",
          100: "#e8e8e8",
          700: "#343434",
          800: "#242424",
          900: "#181818"
        },
        omsons: {
          orange: "#f97316",
          amber: "#ffb347"
        }
      }
    }
  },
  plugins: []
};

export default config;
