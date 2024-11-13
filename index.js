import Web3 from 'web3';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import config from './config.js';

// 显示头部信息
function displayHeader() {
    console.log(chalk.yellow('╔════════════════════════════════════════╗'));
    console.log(chalk.yellow('║      🚀   自动每日领取 $RWT 🚀         ║'));
    console.log(chalk.yellow('║  👤    脚本编写：子清                  ║'));
    console.log(chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║'));
    console.log(chalk.yellow('╚════════════════════════════════════════╝'));
    console.log();  // 添加额外空行以分隔内容
}

// 区块链连接设置
async function setupBlockchainConnection(rpcUrl) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

    try {
        // 跳过 isListening 检查，直接返回 web3 实例
        const blockNumber = await web3.eth.getBlockNumber();
        console.log(chalk.green(`成功连接到 Humanity 协议区块链，当前区块号：${blockNumber}`));
    } catch (error) {
        console.log(chalk.red('连接失败：', error.message));
        process.exit(1);  // 如果连接失败，则退出
    }

    return web3;
}

// 从文件加载私钥
function loadPrivateKeys(filePath) {
    const privateKeys = fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== ''); // 去除空行
    return privateKeys;
}

// 检查奖励是否可以领取
async function claimRewards(privateKey, web3, contract) {
    try {
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const senderAddress = account.address;
        const genesisClaimed = await contract.methods.userGenesisClaimStatus(senderAddress).call();
        const currentEpoch = await contract.methods.currentEpoch().call();
        const { bufferAmount, claimStatus } = await contract.methods.userClaimStatus(senderAddress, currentEpoch).call();

        if (genesisClaimed && !claimStatus) {
            console.log(chalk.green(`正在为地址 ${senderAddress} 领取奖励（Genesis奖励已领取）。`));
            await processClaim(senderAddress, privateKey, web3, contract);
        } else if (!genesisClaimed) {
            console.log(chalk.green(`正在为地址 ${senderAddress} 领取奖励（Genesis奖励未领取）。`));
            await processClaim(senderAddress, privateKey, web3, contract);
        } else {
            console.log(chalk.yellow(`地址 ${senderAddress} 在第 ${currentEpoch} 轮已领取奖励，跳过领取。`));
        }

    } catch (error) {
        handleError(error, privateKey);
    }
}

// 错误处理，显示详细信息
function handleError(error, privateKey) {
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('Rewards: user not registered')) {
        console.log(chalk.red(`错误：用户 ${privateKey} 未注册。`));
    } else {
        console.log(chalk.red(`领取奖励失败，地址 ${privateKey} 错误信息：${errorMessage}`));
    }
}

// 处理领取奖励的交易
async function processClaim(senderAddress, privateKey, web3, contract) {
    try {
        const gasAmount = await contract.methods.claimReward().estimateGas({ from: senderAddress });
        const transaction = {
            to: contract.options.address,
            gas: gasAmount,
            gasPrice: await web3.eth.getGasPrice(),
            data: contract.methods.claimReward().encodeABI(),
            nonce: await web3.eth.getTransactionCount(senderAddress),
            chainId: await web3.eth.net.getId(),
        };

        const signedTxn = await web3.eth.accounts.signTransaction(transaction, privateKey);
        const txHash = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
        console.log(chalk.green(`交易成功，地址 ${senderAddress}，交易哈希：${txHash.transactionHash}`));

    } catch (error) {
        console.log(chalk.red(`处理地址 ${senderAddress} 的领取奖励时出错：${error.message}`));
    }
}

// 主执行函数
async function main() {
    displayHeader();
    const rpcUrl = config.rpcUrl || 'https://rpc.testnet.humanity.org'; // 使用配置中的 RPC 地址或默认 URL
    const web3 = await setupBlockchainConnection(rpcUrl);
    
    const contract = new web3.eth.Contract(config.contractAbi, config.contractAddress);

    // 每 6 小时循环一次
    while (true) {
        const privateKeys = loadPrivateKeys(config.privateKeysFile || './private_keys.txt'); // 指定文件路径或使用默认路径
        for (const privateKey of privateKeys) {
            await claimRewards(privateKey, web3, contract);
        }

        console.log(chalk.cyan('等待 6 小时后再运行一次...'));
        await new Promise(resolve => setTimeout(resolve, 6 * 60 * 60 * 1000)); // 等待 6 小时
    }
}

main().catch(error => console.error(chalk.red('主程序执行出错:', error)));
