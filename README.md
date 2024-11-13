# Humanity-bot

### 项目概述
**Humanity-bot** 是一个自动化脚本，帮助用户每日自动领取区块链奖励。该项目使用 Node.js 和 Web3 库，与区块链进行交互，自动管理账户奖励领取。

---


## 环境准备

1. **安装 Node.js 和 npm**：确保系统中安装了 Node.js 和 npm。

2. **安装依赖**：在项目目录下执行以下命令来安装依赖。
   ```bash
   npm install
   ```

### 使用说明
首先，克隆项目仓库到本地：

```bash
git clone <仓库地址>
cd Humanity-bot
```
. 安装依赖
在项目目录下执行以下命令来安装所需依赖
```bash
npm install
```
配置

private_keys.txt：将需要领取奖励的账户私钥写入 private_keys.txt 文件中，每行一个私钥。例如：

```bash
PRIVATE_KEY_1
PRIVATE_KEY_2
 ```
启动项目
在项目根目录下运行以下命令启动自动领取奖励的程序：
```bash
npm start
```
程序将执行以下流程：

连接到区块链节点并检查连接状态。

遍历 private_keys.txt 中的每个私钥地址，检查奖励领取状态。

如果满足领取条件，程序会自动执行领取交易。

每次领取后，会延时 1 秒，以防止频繁操作导致网络拥堵。

作者

子清

Telegram: https://t.me/ksqxszq
