const { ColorTheme } = require("./colors");

const colors = new ColorTheme();

// 倒计时器类
class CountdownTimer {
  constructor(options = {}) {
    this.options = {
      showCursor: false, // 是否显示光标
      colors: {
        message: colors.colors.timerCount, // 消息文本颜色
        timer: colors.colors.timerWarn, // 倒计时文本颜色
        reset: colors.colors.reset, // 重置颜色
      },
      format: "HH:mm:ss", // 时间格式
      message: "剩余时间: ", // 默认消息
      clearOnComplete: true, // 完成后是否清空屏幕
      ...options, // 可以通过传入 options 覆盖默认设置
    };
  }

  // 格式化倒计时的时间
  formatTime(timeInSeconds, format = this.options.format) {
    const hours = Math.floor(timeInSeconds / 3600); // 计算小时
    const minutes = Math.floor((timeInSeconds % 3600) / 60); // 计算分钟
    const seconds = timeInSeconds % 60; // 计算秒数

    const padNumber = (num) => num.toString().padStart(2, "0"); // 补充 0，保证格式一致

    switch (format.toUpperCase()) {
      case "HH:MM:SS":
        return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
      case "MM:SS":
        return `${padNumber(minutes)}:${padNumber(seconds)}`;
      case "SS":
        return padNumber(seconds);
      case "FULL":
        return `${hours}h ${minutes}m ${seconds}s`;
      case "COMPACT":
        return hours > 0
          ? `${hours}h${minutes}m`
          : minutes > 0
          ? `${minutes}m${seconds}s`
          : `${seconds}s`;
      default:
        return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
    }
  }

  // 启动倒计时
  async start(seconds, options = {}) {
    const config = { ...this.options, ...options };

    if (!config.showCursor) {
      process.stdout.write("\x1B[?25l"); // 隐藏光标
    }

    const {
      colors: { message: messageColor, timer: timerColor, reset },
      message,
    } = config;

    try {
      // 每秒更新显示一次倒计时
      for (let i = seconds; i > 0; i--) {
        process.stdout.clearLine(0); // 清除当前行
        process.stdout.cursorTo(0); // 将光标移到行首
        const timeString = this.formatTime(i, config.format); // 格式化时间
        process.stdout.write(
          `${messageColor}${message}${timerColor}${timeString}${reset}` // 显示倒计时
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待 1 秒
      }

      if (config.clearOnComplete) {
        process.stdout.clearLine(0); // 完成后清空当前行
        process.stdout.cursorTo(0); // 将光标移到行首
      }
    } finally {
      if (!config.showCursor) {
        process.stdout.write("\x1B[?25h"); // 恢复显示光标
      }
    }
  }

  // 静态方法，快速启动倒计时
  static async countdown(seconds, options = {}) {
    const timer = new CountdownTimer(options);
    await timer.start(seconds); // 启动倒计时
  }
}

module.exports = CountdownTimer;
