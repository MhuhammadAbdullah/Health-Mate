module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        teal: { 50:"#E1F5EE", 100:"#9FE1CB", 400:"#1D9E75", 600:"#0F6E56", 800:"#085041" },
        coral: { 50:"#FAECE7", 400:"#D85A30", 600:"#993C1D" },
      },
      fontFamily: { sans:["Inter","system-ui","sans-serif"], display:["Poppins","sans-serif"] },
      animation: {
        "fade-up":"fadeUp 0.4s ease forwards",
        "slide-left":"slideLeft 0.5s ease forwards",
        "scale-in":"scaleIn 0.3s ease forwards",
        "pulse-slow":"pulse 2.5s ease infinite",
        "spin-slow":"spin 1s linear infinite",
      },
      keyframes: {
        fadeUp:{ "0%":{opacity:"0",transform:"translateY(18px)"},"100%":{opacity:"1",transform:"translateY(0)"} },
        slideLeft:{ "0%":{opacity:"0",transform:"translateX(-20px)"},"100%":{opacity:"1",transform:"translateX(0)"} },
        scaleIn:{ "0%":{opacity:"0",transform:"scale(0.95)"},"100%":{opacity:"1",transform:"scale(1)"} },
      },
    },
  },
  plugins: [],
};
