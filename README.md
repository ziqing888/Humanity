# Humanity 测试网自动认领

一个用于在 Humanity Protocol 测试网上领取 THP 代币和奖励的自动化机器人。

### 特征
自动从水龙头领取 THP
自动领取奖励
在满足条件时执行桥接操作
支持多个钱包
漂亮的彩色控制台输出
自动重试机制
错误处理和恢复
准确的倒数计时器
要求
---


## 环境准备
确保系统中安装了 Node.js 和 npm。



## 使用说明
首先，克隆项目仓库到本地：

```bash
git clone https://github.com/ziqing888/Humanity.git
cd Humanity
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


