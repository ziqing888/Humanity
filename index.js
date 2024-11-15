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
  合约地址: "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7", // 掩码
  桥接合约: "0x5F7CaE7D1eFC8cC05da97D988cFFC253ce3273eF", // 掩码
  RPC_URL: "https://rpc.testnet.humanity.org/", // 掩码
  最小Gas价格: "1000000000",
  水龙头URL: "https://faucet.testnet.humanity.org/api/claim", // 掩码
  桥接金额: "1000000000000000000", // 1 ETH 单位为 wei
  最小余额奖励: 0.001,
  最小余额桥接: 1.1,
  默认Gas限制: "300000",
  Gas价格倍数: 1.2,
  Gas限制倍数: 1.2,
  每个钱包之间的等待时间: 3000, // 3秒
  每轮之间的等待时间: 24 * 60 * 60, // 24小时
};

// 合约ABI
const 合约ABI = [
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const 桥接ABI = [
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
    this.initializeWeb3();
    this.initializeHeaders();
  }

  // 初始化Web3
  initializeWeb3() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(CONSTANTS.RPC_URL));
    this.contract = new this.web3.eth.Contract(
      合约ABI,
      CONSTANTS.合约地址
    );
    this.bridgeContract = new this.web3.eth.Contract(
      桥接ABI,
      CONSTANTS.桥接合约
    );
  }

  // 初始化HTTP头部
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

  // 用于掩码敏感数据
  maskAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  maskTxHash(hash) {
    if (!hash) return "";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  // 加载钱包
  async loadWallets() {
    const privateFile = path.join(__dirname, "private_keys.txt");

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

  // 获取安全的Gas价格
  async getSafeGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      const safeGasPrice = Math.max(
        Number(gasPrice),
        Number(CONSTANTS.最小Gas价格)
      ).toString();
      return Math.floor(
        Number(safeGasPrice) * CONSTANTS.Gas价格倍数
      ).toString();
    } catch (error) {
      return CONSTANTS.最小Gas价格;
    }
  }

  // 记录交易详情
  logTransactionDetails(tx, gasPrice) {
    logger.info(colors.style("交易详情:", "menuTitle"));
    logger.info(
      `${colors.style(">", "menuBorder")} Gas价格: ${colors.style(
        `${this.web3.utils.fromWei(gasPrice, "gwei")} gwei`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Gas限制: ${colors.style(
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
      `${colors.style(">", "menuBorder")} Gas价格: ${colors.style(
        `${this.web3.utils.fromWei(gasPrice, "gwei")} gwei`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Gas限制: ${colors.style(
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

  // 领取THP
  async claimTHP(address) {
    try {
      const response = await axios.post(
        CONSTANTS.水龙头URL,
        { address },
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.msg) {
        const txHash = response.data.msg.split("Txhash: ")[1];
        return { success: true, txHash };
      }
      return { success: false, error: "响应格式无效" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 领取奖励
  async claimReward(privateKey, address) {
    try {
      // 检查余额
      const balance = await this.getBalance(address);
      if (parseFloat(balance) < CONSTANTS.最小余额奖励) {
        logger.warn(
          colors.style(
            `余额不足以领取奖励: ${balance} ETH`,
            "warning"
          )
        );
        return;
      }

      const gasPrice = await this.getSafeGasPrice();
      const gasLimit = Math.floor(CONSTANTS.默认Gas限制 * CONSTANTS.Gas限制倍数);

      // 构建交易
      const tx = {
        from: address,
        to: CONSTANTS.合约地址,
        gas: gasLimit,
        gasPrice: gasPrice,
        data: this.contract.methods.claimReward().encodeABI(),
      };

      // 发送交易
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        privateKey
      );
      const sentTx = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      this.logTransactionDetails(sentTx, gasPrice);
      logger.success(
        colors.style(`奖励领取成功: ${this.maskTxHash(sentTx.transactionHash)}`, "success")
      );
    } catch (error) {
      logger.error(colors.style(`领取奖励失败: ${error.message}`, "error"));
    }
  }
}

module.exports = HumanityClient;

