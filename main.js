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
  CONTRACT_ADDRESS: "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7", // 掩码
  BRIDGE_CONTRACT: "0x5F7CaE7D1eFC8cC05da97D988cFFC253ce3273eF", // 掩码
  RPC_URL: "https://rpc.testnet.humanity.org/", // 掩码
  MIN_GAS_PRICE: "1000000000",
  FAUCET_URL: "https://faucet.testnet.humanity.org/api/claim", // 掩码
  BRIDGE_AMOUNT: "1000000000000000000", // 1 ETH 单位为 wei
  MIN_BALANCE_FOR_REWARD: 0.001,
  MIN_BALANCE_FOR_BRIDGE: 1.1,
  DEFAULT_GAS_LIMIT: "300000",
  GAS_PRICE_MULTIPLIER: 1.2,
  GAS_LIMIT_MULTIPLIER: 1.2,
  WAIT_BETWEEN_WALLETS: 3000, // 3秒
  WAIT_BETWEEN_ROUNDS: 24 * 60 * 60, // 24小时
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
    this.initializeWeb3();
    this.initializeHeaders();
  }

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

  async countdown(seconds) {
    await timer.start(seconds, {
      message: colors.style("剩余时间: ", "timerCount"),
      format: "HH:mm:ss",
    });
  }

  formatPrivateKey(privateKey) {
    const trimmed = privateKey.trim();
    return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  }

  // 用于掩码敏感数据的方法
  maskAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  maskTxHash(hash) {
    if (!hash) return "";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

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

  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, "ether");
    } catch (error) {
      return "0";
    }
  }

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

  logTransactionDetails(tx, gasPrice) {
    logger.info(colors.style("交易详情:", "menuTitle"));
    logger.info(
      `${colors.style(">", "menuBorder")} Gas 价格: ${colors.style(
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

  logBridgeDetails(tx, gasPrice, params) {
    logger.info(colors.style("桥接详情:", "menuTitle"));
    logger.info(
      `${colors.style(">", "menuBorder")} 桥接金额: ${colors.style(
        `${this.web3.utils.fromWei(params.amount, "ether")} ETH`,
        "value"
      )}`
    );
    logger.info(
      `${colors.style(">", "menuBorder")} Gas 价格: ${colors.style(
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

  async claimTHP(address) {
    try {
      const response = await axios.post(
        CONSTANTS.FAUCET_URL,
        { address },
        { headers: this.headers }
      );

      if (response.status === 200 && response.data.msg) {
        const txHash = response.data.msg.split("Txhash: ")[1];
        return { success: true, txHash };
      }
      return { success: false, error: "无效的响应格式" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async claimReward(privateKey, address) {
    try {
      // 检查余额
      const balance = await this.getBalance(address);
      if (parseFloat(balance) < CONSTANTS.MIN_BALANCE_FOR_REWARD) {
        return {
          success: false,
          error: `余额不足: ${balance} THP`,
        };
      }

      // 设置交易参数
      const gasPrice = await this.getSafeGasPrice();
      const tx = {
        to: CONSTANTS.CONTRACT_ADDRESS,
        data: this.contract.methods.claimReward().encodeABI(),
        gas: CONSTANTS.DEFAULT_GAS_LIMIT,
        gasPrice,
        nonce: await this.web3.eth.getTransactionCount(address),
      };

      // 签名交易
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        privateKey
      );

      // 发送交易
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      this.logTransactionDetails(receipt, gasPrice);
      return { success: true, txHash: this.maskTxHash(receipt.transactionHash) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async bridgeToMainNet(privateKey, fromAddress, toAddress, amount) {
    try {
      const bridgeAmount = this.web3.utils.toWei(amount, "ether");
      const gasPrice = await this.getSafeGasPrice();
      const tx = {
        from: fromAddress,
        to: CONSTANTS.BRIDGE_CONTRACT,
        data: this.bridgeContract.methods
          .bridgeAsset(1, toAddress, bridgeAmount, CONSTANTS.CONTRACT_ADDRESS, true, "0x")
          .encodeABI(),
        gas: CONSTANTS.DEFAULT_GAS_LIMIT,
        gasPrice,
        nonce: await this.web3.eth.getTransactionCount(fromAddress),
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        privateKey
      );

      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      this.logBridgeDetails(receipt, gasPrice, {
        amount: bridgeAmount,
        destinationAddress: toAddress,
      });

      return { success: true, txHash: this.maskTxHash(receipt.transactionHash) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = HumanityClient;
