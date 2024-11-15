import figlet from "figlet"; 
import { ColorTheme } from "./colors.js"; // 确保正确导入路径和扩展名

const colors = new ColorTheme();

function displayBanner() {
  const banner = figlet.textSync("Humanity BOT", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
  });

  // 更新为新的文本内容
  console.log(colors.style('╔════════════════════════════════════════╗', 'border'));
  console.log(colors.style('║      🚀   自动每日领取 $RWT 🚀         ║', 'header'));
  console.log(colors.style('║  👤    脚本编写：子清                  ║', 'header'));
  console.log(colors.style('║  📢  电报频道：https://t.me/ksqxszq    ║', 'link'));
  console.log(colors.style('╚════════════════════════════════════════╝', 'border'));
}

export default displayBanner; // 使用 export 导出

