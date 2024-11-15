const figlet = require("figlet");
const { ColorTheme } = require("./colors");

const colors = new ColorTheme();

function displayBanner() {
  // 使用 figlet 库生成横幅文字
  const banner = figlet.textSync("Humanity BOT", {
    font: "ANSI Shadow", // 设置字体
    horizontalLayout: "default", // 水平布局方式
    verticalLayout: "default", // 垂直布局方式
    width: 100, // 设置横幅宽度
  });

  // 输出横幅的样式
  console.log(colors.style(banner, "header"));
  console.log(
    colors.style("===============================================", "border") // 输出分隔符
  );
  console.log(colors.style("编写者: 子清", "link")); // 输出编写者信息
  console.log(colors.style("电报频道: https://t.me/ksqxszq", "link")); // 输出电报频道链接
  console.log(
    colors.style("===============================================\n", "border") // 输出分隔符
  );
}

module.exports = displayBanner;



