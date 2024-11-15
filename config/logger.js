const winston = require("winston");
const { ColorTheme } = require("./colors");

// Initialize color theme
const colors = new ColorTheme();

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    custom: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "cyan",
    success: "green",
    custom: "magenta",
  },
};

const padLevel = (level) => {
  const padLength = 7;
  return level.toUpperCase().padEnd(padLength);
};

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    // Map level colors
    const levelColors = {
      error: colors.colors.error,
      warn: colors.colors.warning,
      info: colors.colors.info,
      success: colors.colors.success,
      custom: colors.colors.highlight,
    };

    // Color the timestamp using dim style
    const coloredTimestamp = `${colors.baseColors.dim}${timestamp}${colors.colors.reset}`;

    // Color the level
    const coloredLevel = `${levelColors[level]}${padLevel(level)}${
      colors.colors.reset
    }`;

    return `${coloredTimestamp} | ${coloredLevel} | ${message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: "custom",
  format: customFormat,
  transports: [new winston.transports.Console()],
});

winston.addColors(customLevels.colors);

module.exports = { logger };
