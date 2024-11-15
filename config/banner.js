const figlet = require("figlet");
const { ColorTheme } = require("./colors");

const colors = new ColorTheme();

function displayBanner() {
  const banner = figlet.textSync("Humanity BOT", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
  });

  console.log(colors.style(banner, "header"));  // 显示横幅
  console.log(
    colors.style("===============================================", "border")  // 边框
  );
  console.log(colors.style("编写：qklxsqf", "link"));  // GitHub 链接
  console.log(colors.style("电报频道：https://t.me/ksqxszq", "link"));  // Telegram 链接
  console.log(
    colors.style("===============================================\n", "border")  // 边框
  );
}

module.exports = displayBanner;

