const figlet = require("figlet");
const { ColorTheme } = require("./colors");

class BannerDisplay {
  constructor() {
    this.colors = new ColorTheme();
    this.config = {
      font: "Slant", 
      horizontalLayout: "fitted",
      verticalLayout: "fitted",
      width: 80,
      separator: "─✦─".repeat(15), 
    };
  }

  createArtText(text) {
    return figlet.textSync(text, this.config);
  }

  formatLine(text, style, padding = false) {
    const formatted = this.colors.style(text, style);
    return padding ? ` ${formatted} ` : formatted;
  }

  display() {
    const bannerContent = [
      // 顶部装饰
      this.formatLine(" ", "border"), 
      
      // 主标题
      this.formatLine(this.createArtText("Humanity BOT"), "header"),
      
      // 分隔线
      this.formatLine(this.config.separator, "border", true),
      
      // 信息区域
      this.formatLine("✧ 作者: 子清", "accent", true),
      this.formatLine("✧ X: ", "link", true),
      
      // 底部装饰
      this.formatLine(this.config.separator, "border", true),
      "" // 底部空行
    ];

    console.log(bannerContent.join("\n"));
  }
}

function displayBanner() {
  const banner = new BannerDisplay();
  banner.display();
}

module.exports = displayBanner;



