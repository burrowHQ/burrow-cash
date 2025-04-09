/** @type {import("tailwindcss").Config} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require("tailwindcss/plugin");

const getStyleMapping = (max, min) => {
  if (!max) {
    return;
  }
  const maxArray = [...Array(max + 1).keys()];
  return maxArray.reduce((pre, cur) => {
    // eslint-disable-next-line no-unused-expressions
    cur >= min && (pre[cur] = `${cur / 4}rem`);
    return pre;
  }, {});
};
module.exports = {
  content: [
    "./screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".fc": {
          display: "flex",
          alignItems: "center",
        },
      });
    }),
  ],
  theme: {
    screens: {
      xs: { min: "400px", max: "639px" },
      sm: { min: "640px", max: "767px" },
      md: { min: "768px" },
      lg: { min: "1024px" },
      xl: { min: "1280px" },
      "2xl": { min: "1536px" },
      // xs: { min: "300px", max: "600px" },
      xsm: { min: "300px", max: "1023px" },
      xsm2: { max: "767px" },
      // md: { min: "600px", max: "1023px" },
      // lg: { min: "1024px" },
      lg2: { min: "1092px" },
      lg3: { min: "1134px" },
      // xl: { min: "1280px" },
      // "2xl": { min: "1536px" },
      "3xl": { min: "1792px" },
    },
    boxShadow: {},
    extend: {
      width: {
        ...getStyleMapping(1800, 0),
      },
      minWidth: {
        ...getStyleMapping(1800, 0),
      },
      boxShadow: {
        100: "0px 0px 2px 0px #00000080",
      },
      backgroundImage: () => ({
        linear_gradient_yellow:
          "linear-gradient(123.3deg, #00F7A5 45.55%, rgba(210, 255, 58, 0) 81.79%)",
        linear_gradient_dark: "linear-gradient(180deg, #525365 0%, #2E3043 100%)",
      }),
      gridTemplateColumns: {
        "3/5": "65% 35%",
      },
      gridTemplateRows: {},
      fontSize: {
        h1: "90px",
        h2: "26px",
        h3: "18px",
        56: "56px",
      },
      borderRadius: {
        sm: "6px",
      },
      colors: {
        primary: "#00F7A5",
        claim: "#7C89FF",
        warning: "#F3BA2F",
        danger: "#FF4000",
        orange: "#FF6947",
        blue: {
          50: "#45AFFF",
          100: "#398FED",
        },
        green: {
          50: "#00B4B4",
          100: "#16F195",
          150: "#2EFFB9",
        },
        orangeRed: {
          50: "#FFE3CC",
        },
        dark: {
          50: "#303037",
          100: "#202026",
          110: "#1C1C22",
          120: "#222026",
          130: "#14162B",
          150: "#404263",
          200: "#16161B",
          250: "#202026",
          350: "#324451",
          400: "#6D708D",
          500: "#40435A",
          600: "#16161B",
          700: "#393C58",
          800: "#979ABE",
          900: "#C0C4E9",
          950: "#31344C",
          1000: "#3E4260",
          1050: "#2F324A",
          1100: "#404040",
          1150: "#2F324B",
          1200: "#444766",
          1250: "#727591",
        },
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          110: "#2D2D2D",
          120: "#7E8A93",
          130: "#414B57",
          140: "#B5B5B5",
          150: "#38363C",
          160: "#6F6E72",
          170: "#6A7279",
          180: "#88888A",
          190: "#2A2A31",
          200: "#eeeeee",
          300: "#8A8A8D",
          380: "#6D708D",
          400: "#626486",
          500: "#25252C",
          700: "#494D69",
          800: "#202026",
          900: "#0f101c",
          950: "#787B93",
          1000: "#3A3A3A",
          1050: "#ECECEC",
          1100: "#2F324B",
          1200: "#D8DCFF",
          1250: "#454869",
          1350: "#565A7B",
          1400: "#5A5C7A",
          1300: "#565874",
        },
        yellow: {
          50: "#DEF700",
          100: "#FFEE2E",
        },
        toolTipBoxBgColor: "rgba(35,37,58,0.8)",
        marginCloseBtn: "rgba(192, 196, 233, 0.4)",
        marginWithdrawAllBtn: "rgba(210, 255, 58, 0.6)",
      },
    },
  },
  variants: {
    scale: ["responsive", "hover", "focus", "group-hover"],
    textColor: ["responsive", "hover", "focus", "group-hover"],
    opacity: [],
    backgroundColor: ["responsive", "hover", "focus", "group-hover"],
  },
};
