const { ColorTheme } = require("./colors");

const colors = new ColorTheme();

class CountdownTimer {
  constructor(options = {}) {
    this.options = {
      showCursor: false, // 是否显示光标
      colors: {
        message: colors.colors.timerCount, // 消息颜色
        timer: colors.colors.timerWarn,    // 倒计时颜色
        reset: colors.colors.reset,        // 重置颜色
      },
      format: "HH:mm:ss", // 默认时间格式
      message: "剩余时间: ", // 默认消息
      clearOnComplete: true, // 倒计时完成后是否清除
      ...options, // 合并传入的配置选项
    };
  }

  // 格式化时间
  formatTime(timeInSeconds, format = this.options.format) {
    const hours = Math.floor(timeInSeconds / 3600); // 计算小时
    const minutes = Math.floor((timeInSeconds % 3600) / 60); // 计算分钟
    const seconds = timeInSeconds % 60; // 计算秒数

    const padNumber = (num) => num.toString().padStart(2, "0"); // 格式化为两位数字

    switch (format.toUpperCase()) {
      case "HH:MM:SS": // 格式：小时:分钟:秒
        return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
      case "MM:SS": // 格式：分钟:秒
        return `${padNumber(minutes)}:${padNumber(seconds)}`;
      case "SS": // 格式：秒
        return padNumber(seconds);
      case "FULL": // 格式：小时h 分钟m 秒s
        return `${hours}h ${minutes}m ${seconds}s`;
      case "COMPACT": // 简洁格式
        return hours > 0
          ? `${hours}h${minutes}m`
          : minutes > 0
          ? `${minutes}m${seconds}s`
          : `${seconds}s`;
      default:
        return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`; // 默认格式
    }
  }

  // 启动倒计时
  async start(seconds, options = {}) {
    const config = { ...this.options, ...options }; // 合并配置项

    if (!config.showCursor) {
      process.stdout.write("\x1B[?25l"); // 隐藏光标
    }

    const {
      colors: { message: messageColor, timer: timerColor, reset },
      message,
    } = config;

    try {
      for (let i = seconds; i > 0; i--) {
        process.stdout.clearLine(0); // 清除当前行
        process.stdout.cursorTo(0); // 将光标移动到行首
        const timeString = this.formatTime(i, config.format); // 格式化时间
        process.stdout.write(
          `${messageColor}${message}${timerColor}${timeString}${reset}` // 输出带颜色的时间
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
      }

      if (config.clearOnComplete) {
        process.stdout.clearLine(0); // 清除当前行
        process.stdout.cursorTo(0); // 将光标移动到行首
      }
    } finally {
      if (!config.showCursor) {
        process.stdout.write("\x1B[?25h"); // 显示光标
      }
    }
  }

  // 静态方法：启动倒计时
  static async countdown(seconds, options = {}) {
    const timer = new CountdownTimer(options);
    await timer.start(seconds); // 启动倒计时
  }
}

module.exports = CountdownTimer;
