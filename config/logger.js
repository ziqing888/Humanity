const winston = require("winston");
const { ColorTheme } = require("./colors");

// 初始化颜色主题
const colors = new ColorTheme();

const customLevels = {
  levels: {
    error: 0,       // 错误
    warn: 1,        // 警告
    info: 2,        // 信息
    success: 3,     // 成功
    custom: 4,      // 自定义
  },
  colors: {
    error: "red",      // 错误的颜色是红色
    warn: "yellow",    // 警告的颜色是黄色
    info: "cyan",      // 信息的颜色是青色
    success: "green",  // 成功的颜色是绿色
    custom: "magenta", // 自定义的颜色是品红色
  },
};

// 填充日志级别，使其对齐
const padLevel = (level) => {
  const padLength = 7;  // 设置填充长度为7
  return level.toUpperCase().padEnd(padLength);
};

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // 时间戳格式
  winston.format.printf(({ timestamp, level, message }) => {
    // 映射日志级别的颜色
    const levelColors = {
      error: colors.colors.error,
      warn: colors.colors.warning,
      info: colors.colors.info,
      success: colors.colors.success,
      custom: colors.colors.highlight,
    };

    // 使用灰色样式给时间戳上色
    const coloredTimestamp = `${colors.baseColors.dim}${timestamp}${colors.colors.reset}`;

    // 给日志级别上色
    const coloredLevel = `${levelColors[level]}${padLevel(level)}${colors.colors.reset}`;

    // 返回格式化后的日志
    return `${coloredTimestamp} | ${coloredLevel} | ${message}`;
  })
);

// 创建日志记录器实例
const logger = winston.createLogger({
  levels: customLevels.levels,  // 设置自定义的日志级别
  level: "custom",              // 默认日志级别为“custom”
  format: customFormat,         // 设置自定义的日志格式
  transports: [new winston.transports.Console()], // 设置日志输出到控制台
});

// 为日志级别添加颜色
winston.addColors(customLevels.colors);

module.exports = { logger };  // 导出logger实例
