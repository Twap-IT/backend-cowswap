/*
import express from 'express';
import { web3Router } from './routes/web3.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware for parsing JSON bodies
app.use('/web3', web3Router); // Web3 routes

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
*/

import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const main = async () => { 

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(provider);

  const address = wallet.address;

  const wethAddress = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6';
  const wethABI = [
    {
    "constant": false,
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
    },
    {
    "constant": false,
    "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
    },
    {
    "constant": false,
    "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    }
  ];



  // WETH Contract instance
  const wethContract = new ethers.Contract(wethAddress, wethABI, wallet);

  console.log(await wethContract.balanceOf(address));

  const amountToWrap = ethers.parseEther("0.1");
  let tx = await wethContract.deposit({ value: amountToWrap });
  await tx.wait();

  console.log(await wethContract.balanceOf(address));
  console.log(address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });