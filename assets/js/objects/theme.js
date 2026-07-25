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

  applyImages(root = document) {
    const theme = this.getTheme();
    root.querySelectorAll("[data-theme-image]").forEach((element) => {
      const imageUrl = element.getAttribute(`data-theme-image-${theme}`);
      if (imageUrl) {
        element.src = imageUrl;
      }
    });
  },

  // Turbo Drive swaps the <body> on navigation and Turbo Streams insert
  // elements at any time — neither refires DOMContentLoaded, so watch for
  // elements arriving after the initial load and theme their images too.
  observeImages() {
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches("[data-theme-image]")) {
            this.applyImages(node.parentNode || document);
          } else if (node.querySelector("[data-theme-image]")) {
            this.applyImages(node);
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  },

  init() {
    this.applyTheme();
    this.observeImages();

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      this.applyTheme();
    });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.applyImages());
    } else {
      this.applyImages();
    }
  }
};