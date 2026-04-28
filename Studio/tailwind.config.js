module.exports = {
  content: ["./public/**/*.html", "./public/**/*.js"],
  theme: {
    extend: {
      colors: {
        studio_bg: "#1f1b0a",
        studio_accent: "#a67c00",
        studio_gold: "#ffc400"
      },
      keyframes: {
        wobble: {
          "0%, 100%": {
            transform: "translateX(0%)",
            "transform-origin": "50% 50%",
          },
          "15%": {
            transform: "translateX(-15px) rotate(-6deg)",
          },
          "30%": {
            transform: "translateX(10px) rotate(6deg)",
          },
          "45%": {
            transform: "translateX(-8px) rotate(-3.6deg)",
          },
          "60%": {
            transform: "translateX(5px) rotate(2.4deg)",
          },
          "75%": {
            transform: "translateX(-2px) rotate(-1.2deg)",
          },
        },
      },
      animation: {
        wobble: "wobble 0.8s ease-in-out",
      },
    }
  },
  plugins: []
};
