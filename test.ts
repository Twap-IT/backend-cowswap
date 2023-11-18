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
import wethABI from "./abis/weth.json";
import Safe, { SafeFactory, SafeAccountConfig, EthersAdapter } from '@safe-global/protocol-kit';
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';


import dotenv from 'dotenv';
dotenv.config();

const main = async () => { 

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(provider);

  const address = wallet.address;

  console.log('signer', address);
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: wallet
  })

  const safeAccountConfig: SafeAccountConfig = {
    owners: [address],
    threshold: 1,
    fallbackHandler: process.env.EXTENSIBLE_FALLBACK_HANDLER_ADDRESS
  }

  const safeVersion='1.3.0';
  const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion });
  // SAFE creation is deterministic so need unique salt per address per SAFE 
  // or else CREATE2 call will fail
  const saltNonce = '123338389221';
  const safeSdk = await safeFactory.deploySafe({ safeAccountConfig, saltNonce });

  const safeAddress = await safeSdk.getAddress();
  console.log('safeAddress', safeAddress);

  const fallbackAddress = await safeSdk.getFallbackHandler();
  console.log('configured fallback', fallbackAddress);
  // WETH Contract instance
  /*
  const wethContract = new ethers.Contract(process.env.WETH_ADDRESS!, wethABI, wallet);

  console.log((await wethContract.balanceOf(address)).toString());

  const amountToWrap = ethers.utils.parseEther("0.1");
  let tx = await wethContract.deposit({ value: amountToWrap });
  await tx.wait();

  console.log((await wethContract.balanceOf(address)).toString());
  console.log(address);
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
