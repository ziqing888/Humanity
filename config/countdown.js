const { ColorTheme } = require("./colors");

const colors = new ColorTheme();

class CountdownTimer {
  constructor(options = {}) {
    this.options = {
      showCursor: false, 
      colors: {
        message: colors.colors.timerCount, 
        timer: colors.colors.timerWarn,    
        reset: colors.colors.reset,        
      },
      format: "HH:mm:ss", 
      message: "剩余时间: ", 
      clearOnComplete: true, 
      ...options, 
    };
  }

  // 格式化时间
  formatTime(timeInSeconds, format = this.options.format) {
    const hours = Math.floor(timeInSeconds / 3600); 
    const minutes = Math.floor((timeInSeconds % 3600) / 60); 
    const seconds = timeInSeconds % 60; 

    const padNumber = (num) => num.toString().padStart(2, "0"); 

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

  
  async start(seconds, options = {}) {
    const config = { ...this.options, ...options }; 

    if (!config.showCursor) {
      process.stdout.write("\x1B[?25l"); 
    }

    const {
      colors: { message: messageColor, timer: timerColor, reset },
      message,
    } = config;

    try {
      for (let i = seconds; i > 0; i--) {
        process.stdout.clearLine(0); 
        process.stdout.cursorTo(0); 
        const timeString = this.formatTime(i, config.format); 
        process.stdout.write(
          `${messageColor}${message}${timerColor}${timeString}${reset}` 
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); 
      }

      if (config.clearOnComplete) {
        process.stdout.clearLine(0); 
        process.stdout.cursorTo(0); 
      }
    } finally {
      if (!config.showCursor) {
        process.stdout.write("\x1B[?25h"); 
      }
    }
  }

  
  static async countdown(seconds, options = {}) {
    const timer = new CountdownTimer(options);
    await timer.start(seconds); 
  }
}

module.exports = CountdownTimer;
