import api from "objects/api";

export default {
  themeUrl: "https://components.lucasvanbriemen.nl/api/colors",

  custom_colors: {
    // "starred": {
    //   "dark": "rgb(238, 222, 108)",
    //   "light": "rgb(248, 255, 38)"
    // },
  },

  getTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },

  async applyTheme() {
    document.documentElement.setAttribute("data-theme", this.getTheme());
    const colors = await api.get(this.themeUrl);

    const mergedColors = { ...colors, ...this.custom_colors };

    Object.entries(mergedColors).forEach(([name, color]) => {
      const value = this.getTheme() === "dark" ? color.dark : color.light;
      document.documentElement.style.setProperty(`--${name}`, value);
    });

    this.applyImages();
  },

  applyImages() {
    const theme = this.getTheme();
    document.querySelectorAll("[data-theme-image]").forEach((element) => {
      const imageUrl = element.getAttribute(`data-theme-image-${theme}`);
      if (imageUrl) {
        element.src = imageUrl;
      }
    });
  },

  init() {
    this.applyTheme();

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      this.applyTheme();
    });

    document.addEventListener("DOMContentLoaded", () => {
      this.applyImages();
    });
  }
};