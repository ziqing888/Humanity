class ColorTheme {
  constructor(customColors = {}) {
    // ANSI Base Colors
    this.baseColors = {
      // Reset
      reset: "\x1b[0m",

      // Styles
      bold: "\x1b[1m",
      dim: "\x1b[2m",
      italic: "\x1b[3m",
      underline: "\x1b[4m",
      blink: "\x1b[5m",

      // Base Colors
      black: "\x1b[30m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      gray: "\x1b[90m",

      // Bright Colors
      brightRed: "\x1b[91m",
      brightGreen: "\x1b[92m",
      brightYellow: "\x1b[93m",
      brightBlue: "\x1b[94m",
      brightMagenta: "\x1b[95m",
      brightCyan: "\x1b[96m",
      brightWhite: "\x1b[97m",

      // Background Colors
      bgBlack: "\x1b[40m",
      bgRed: "\x1b[41m",
      bgGreen: "\x1b[42m",
      bgYellow: "\x1b[43m",
      bgBlue: "\x1b[44m",
      bgMagenta: "\x1b[45m",
      bgCyan: "\x1b[46m",
      bgWhite: "\x1b[47m",

      // Bright Background Colors
      bgBrightRed: "\x1b[101m",
      bgBrightGreen: "\x1b[102m",
      bgBrightYellow: "\x1b[103m",
      bgBrightBlue: "\x1b[104m",
      bgBrightMagenta: "\x1b[105m",
      bgBrightCyan: "\x1b[106m",
      bgBrightWhite: "\x1b[107m",
    };

    // Default Theme
    this.defaultTheme = {
      // Status Colors
      success: this.baseColors.brightGreen,
      error: this.baseColors.brightRed,
      warning: this.baseColors.brightYellow,
      info: this.baseColors.brightCyan,
      debug: this.baseColors.gray,

      // UI Elements
      header: this.baseColors.brightMagenta,
      border: this.baseColors.cyan,
      text: this.baseColors.brightWhite,
      link: this.baseColors.brightCyan,
      highlight: this.baseColors.brightYellow,

      // Progress Indicators
      progress: this.baseColors.brightCyan,
      waiting: this.baseColors.brightYellow,
      complete: this.baseColors.brightGreen,
      failed: this.baseColors.brightRed,

      // Data Display
      value: this.baseColors.brightYellow,
      label: this.baseColors.cyan,

      // Timer Elements
      timerCount: this.baseColors.brightCyan,
      timerWarn: this.baseColors.brightYellow,
      timerExpired: this.baseColors.brightRed,

      // Menu Elements
      menuTitle: this.baseColors.brightMagenta,
      menuOption: this.baseColors.brightCyan,
      menuBorder: this.baseColors.cyan,
      menuSelected: this.baseColors.brightYellow,

      // Account Related
      accountName: this.baseColors.brightMagenta,
      accountInfo: this.baseColors.brightCyan,
      accountWarn: this.baseColors.brightYellow,
      accountError: this.baseColors.brightRed,

      // Transaction Status
      txPending: this.baseColors.brightYellow,
      txSuccess: this.baseColors.brightGreen,
      txFailed: this.baseColors.brightRed,
      txHash: this.baseColors.brightCyan,

      // Always include reset
      reset: this.baseColors.reset,
    };

    // Merge custom colors with default theme
    this.colors = { ...this.defaultTheme, ...customColors };
  }

  // Helper Methods
  wrap(text, colorKey) {
    return `${this.get(colorKey)}${text}${this.colors.reset}`;
  }

  get(colorKey) {
    return this.colors[colorKey] || this.colors.reset;
  }

  // Create custom theme
  createTheme(themeColors) {
    return new ColorTheme(themeColors);
  }

  // Common text styling methods
  success(text) {
    return this.wrap(text, "success");
  }
  error(text) {
    return this.wrap(text, "error");
  }
  warning(text) {
    return this.wrap(text, "warning");
  }
  info(text) {
    return this.wrap(text, "info");
  }
  highlight(text) {
    return this.wrap(text, "highlight");
  }

  // Combine multiple colors
  style(text, ...colorKeys) {
    const colorCodes = colorKeys.map((key) => this.get(key)).join("");
    return `${colorCodes}${text}${this.colors.reset}`;
  }
}

// Create default instance
const defaultTheme = new ColorTheme();

// Export both class and default instance
module.exports = {
  ColorTheme,
  colors: defaultTheme,
};
