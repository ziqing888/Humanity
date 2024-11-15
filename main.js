const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Web3 } = require("web3");
const { logger } = require("./config/logger");
const displayBanner = require("./config/banner");
const CountdownTimer = require("./config/countdown");
const { ColorTheme } = require("./config/colors");

// 初始化工具
const colors = new ColorTheme();
const timer = new CountdownTimer();

// 常量
const CONSTANTS = {
  CONTRACT_ADDRESS: "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7", // 掩码地址
  BRIDGE_CONTRACT: "0x5F7CaE7D1eFC8cC05da97D988cFFC253ce3273eF", // 掩码地址
  RPC_URL: "https://rpc.testnet.humanity.org/", // RPC 地址
  MIN_GAS_PRICE: "1000000000", // 最小油价
  FAUCET_URL: "https://faucet.testnet.humanity.org/api/claim", // 水龙头 URL
  BRIDGE_AMOUNT: "1000000000000000000", // 1 ETH（以 wei 为单位）
  MIN_BALANCE_FOR_REWARD: 0.001, // 奖励所需的最低余额
  MIN_BALANCE_FOR_BRIDGE: 1.1, // 桥接所需的最低余额
  DEFAULT_GAS_LIMIT: "300000", // 默认 gas 限制
  GAS_PRICE_MULTIPLIER: 1.2, // 油价乘数
  GAS_LIMIT_MULTIPLIER: 1.2, // gas 限制乘数
  WAIT_BETWEEN_WALLETS: 3000, // 每次钱包间等待 3 秒
  WAIT_BETWEEN_ROUNDS: 24 * 60 * 60, // 每 24 小时等待一次
};

// 合约 ABI
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const BRIDGE_ABI = [
  {
    inputs: [
      { internalType: "uint32", name: "destinationNetwork", type: "uint32" },
      { internalType: "address", name: "destinationAddress", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "bool", name: "forceUpdateGlobalExitRoot", type: "bool" },
      { internalType: "bytes", name: "permitData", type: "bytes" },
    ],
    name: "bridgeAsset",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

class HumanityClient {
  constructor() {
    this.initializeWeb3(); // 初始化 Web3
    this.initializeHeaders(); // 初始化请求头
  }

  // 初始化 Web3
  initializeWeb3() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(CONSTANTS.RPC_URL));
    this.contract = new this.web3.eth.Contract(
      CONTRACT_ABI,
      CONSTANTS.CONTRACT_ADDRESS
    );
    this.bridgeContract = new this.web3.eth.Contract(
      BRIDGE_ABI,
      CONSTANTS.BRIDGE_CONTRACT
    );
  }

  // 初始化请求头
  initializeHeaders() {
    this.headers = {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US;q=0.6,en;q=0.5",
      "content-type": "application/json",
      origin: "https://faucet.testnet.humanity.org",
      referer: "https://faucet.testnet.humanity.org/",
      "sec-ch-ua":
        '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99""',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    };
  }

  // 倒计时
  async countdown(seconds) {
    await timer.start(seconds, {
      message: colors.style("剩余时间: ", "timerCount"),
      format: "HH:mm:ss",
    });
  }

  // 格式化私钥
  formatPrivateKey(privateKey) {
    const trimmed = privateKey.trim();
    return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  }

  // 掩码地址
  maskAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // 掩码交易哈希
  maskTxHash(hash) {
    if (!hash) return "";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  // 加载钱包
  async loadWallets() {
    const privateFile = path.join(__dirname, "data.txt");

    try {
      const privateKeys = fs
        .readFileSync(privateFile, "utf8")
        .replace(/\r/g, "")
        .split("\n")
        .map((key) => key.trim())
        .filter(Boolean);

      const wallets = privateKeys.map((privateKey) => {
        const formattedKey = this.formatPrivateKey(privateKey);
        const account =
          this.web3.eth.accounts.privateKeyToAccount(formattedKey);
        return {
          address: account.address,
          privateKey: formattedKey,
        };
      });

      logger.info(
        colors.style(
          `成功加载 ${wallets.length} 个钱包`,
          "accountInfo"
        )
      );
      return wallets;
    } catch (error) {
      logger.error(
        colors.style(`加载钱包失败: ${error.message}`, "accountError")
      );
      process.exit(1);
    }
  }

  // 获取余额
  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, "ether");
    } catch (error) {
      return "0";
    }
  }

  // 获取安全油价
  async getSafeGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      const safeGasPrice = Math.max(
        Number(gasPrice),
        Number(CONSTANTS.MIN_GAS_PRICE)
      ).toString();
      return Math.floor(
        Number(safeGasPrice) * CONSTANTS.GAS_PRICE_MULTIPLIER
      ).toString();
    } catch (error) {
      return CONSTANTS.MIN_GAS_PRICE;
    }
  }

  // 记录交易详情
  logTransactionDetails(tx, gasPrice) {
    logger.info(colors.style("交易详情:", "menuTitle"));
    logger.info(
      `${colors.style(">", "menuBorder")} 油价: ${colors.style(
        `${this.web3.utils.fromWei(gasPrice, "gwei")} gwei`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Gas 限制: ${colors.style(
        tx.gas,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Nonce: ${colors.style(
        tx.nonce,
        "value"
      )}`
    );
  }

  // 记录桥接交易详情
  logBridgeDetails(tx, gasPrice, params) {
    logger.info(colors.style("桥接详情:", "menuTitle"));
    logger.info(
      `${colors.style(">", "menuBorder")} 桥接金额: ${colors.style(
        `${this.web3.utils.fromWei(params.amount, "ether")} ETH`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} 油价: ${colors.style(
        `${this.web3.utils.fromWei(gasPrice, "gwei")} gwei`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Gas 限制: ${colors.style(
        tx.gas,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} 目标地址: ${colors.style(
        this.maskAddress(params.destinationAddress),
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Nonce: ${colors.style(
        tx.nonce,
        "value"
      )}`
    );
  }

  // 申请奖励
  async claimTHP(address) {
    try {
      const response = await axios.post(
        CONSTANTS.FAUCET_URL,
        { address },
        { headers: this.headers }
      );
      if (response.data.status === "success") {
        logger.info(colors.style("成功申请奖励", "rewardSuccess"));
      } else {
        logger.error(colors.style("申请奖励失败", "rewardError"));
      }
    } catch (error) {
      logger.error(colors.style(`申请奖励失败: ${error.message}`, "rewardError"));
    }
  }

  // 自动桥接
  async bridgeFunds(wallet, amount) {
    try {
      const gasPrice = await this.getSafeGasPrice();
      const params = {
        destinationNetwork: 1,
        destinationAddress: wallet.address,
        amount: this.web3.utils.toWei(amount, "ether"),
        token: "0xC8D45b05b7dD0C3E61a39661B2617FE1B5509B04", // 使用的代币合约地址
        forceUpdateGlobalExitRoot: true,
        permitData: "0x", // 此处可以填写额外参数
      };

      const tx = {
        from: wallet.address,
        to: CONSTANTS.BRIDGE_CONTRACT,
        data: this.bridgeContract.methods.bridgeAsset(...Object.values(params)).encodeABI(),
        gasPrice,
        gas: CONSTANTS.DEFAULT_GAS_LIMIT,
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        wallet.privateKey
      );

      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      this.logBridgeDetails(receipt, gasPrice, params);
    } catch (error) {
      logger.error(colors.style(`桥接失败: ${error.message}`, "bridgeError"));
    }
  }
}

module.exports = HumanityClient;

