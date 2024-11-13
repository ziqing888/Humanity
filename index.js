const Web3 = require('web3');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// 显示头部信息
function displayHeader() {
    console.log(chalk.yellow('╔════════════════════════════════════════╗'));
    console.log(chalk.yellow('║      🚀   自动每日领取 $RWT 🚀        ║'));
    console.log(chalk.yellow('║  👤    脚本编写：子清                  ║'));
    console.log(chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║'));
    console.log(chalk.yellow('╚════════════════════════════════════════╝'));
    console.log();
}

// 区块链设置和连接
async function setupBlockchainConnection(rpcUrl) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const isConnected = await web3.eth.net.isListening();
    if (isConnected) {
        console.log(chalk.green("已连接到人类协议"));
    } else {
        console.log(chalk.red("连接失败。"));
        process.exit(1);  // 如果连接失败，则退出
    }
    return web3;
}

// 从文件加载私钥
function loadPrivateKeys(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`错误: 文件 ${filePath} 不存在！`));
        process.exit(1); // 如果文件不存在，退出程序
    }
    return fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line.trim());
}

// 检查是否需要领取奖励
async function claimRewards(privateKey, web3, contract) {
    try {
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const senderAddress = account.address;
        const genesisClaimed = await contract.methods.userGenesisClaimStatus(senderAddress).call();
        const currentEpoch = await contract.methods.currentEpoch().call();
        const claimStatus = await contract.methods.userClaimStatus(senderAddress, currentEpoch).call();

        if (genesisClaimed && !claimStatus[1]) {
            console.log(chalk.green(`为地址 ${senderAddress} 领取奖励 (创世奖励已领取)。`));
            await processClaim(senderAddress, privateKey, web3, contract);
        } else if (!genesisClaimed) {
            console.log(chalk.green(`为地址 ${senderAddress} 领取奖励 (创世奖励未领取)。`));
            await processClaim(senderAddress, privateKey, web3, contract);
        } else {
            console.log(chalk.yellow(`地址 ${senderAddress} 在第 ${currentEpoch} 期已领取奖励，跳过。`));
        }
    } catch (error) {
        handleError(error, senderAddress);
    }
}

// 处理特定错误以清晰显示
function handleError(error, address) {
    const errorMessage = error.toString();
    if (errorMessage.includes("Rewards: user not registered")) {
        console.log(chalk.red(`错误: 用户 ${address} 未注册。`));
    } else {
        console.log(chalk.red(`为 ${address} 领取奖励时出错: ${errorMessage}`));
    }
}

// 处理领取奖励的交易
async function processClaim(senderAddress, privateKey, web3, contract) {
    try {
        const gasAmount = await contract.methods.claimReward().estimateGas({ from: senderAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(senderAddress);

        const transaction = contract.methods.claimReward().encodeABI();
        const tx = {
            from: senderAddress,
            to: contract.options.address,
            data: transaction,
            gas: gasAmount,
            gasPrice: gasPrice,
            nonce: nonce,
            chainId: await web3.eth.getChainId()
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(chalk.green(`交易成功，地址 ${senderAddress}，交易哈希: ${receipt.transactionHash}`));
    } catch (error) {
        console.log(chalk.red(`为 ${senderAddress} 处理领取奖励时出错: ${error.toString()}`));
    }
}

// 主执行函数
(async () => {
    displayHeader();
    const rpcUrl = 'https://rpc.testnet.humanity.org';  // 更新为您的 RPC URL
    const web3 = await setupBlockchainConnection(rpcUrl);

    const contractAddress = '0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7'; // 合约地址
    const contractAbi = [ /* ABI 内容省略 */ ]; // 在这里插入您的合约 ABI
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    const privateKeys = loadPrivateKeys(path.join(__dirname, 'private_keys.txt'));

    for (const privateKey of privateKeys) {
        await claimRewards(privateKey, web3, contract);
        await new Promise(resolve => setTimeout(resolve, 1000));  // 延时1秒
    }
})();


