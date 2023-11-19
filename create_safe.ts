

import { ethers } from 'ethers';
//import wethABI from "./abis/weth.json";
import Safe, { SafeFactory, SafeAccountConfig, EthersAdapter, PredictedSafeProps } from '@safe-global/protocol-kit';


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
  const saltNonce = Math.floor(Math.random() * 100000).toString();
  const predictedAddress = await safeFactory.predictSafeAddress(safeAccountConfig, saltNonce );
  console.log('predicted address', predictedAddress);

  let safeSdk:any;
  try {
    safeSdk = await safeFactory.deploySafe({ safeAccountConfig, saltNonce });
  }
  catch(e){
    // SAFE is deployed but RPC errors out, so just connect to it
    console.log("workaround - connecting to deployed SAFE");
    safeSdk = await Safe.create({ethAdapter, safeAddress: predictedAddress})
  }


  const safeAddress = await safeSdk.getAddress();
  console.log('safeAddress', safeAddress);

  const fallbackAddress = await safeSdk.getFallbackHandler();
  console.log('configured fallback', fallbackAddress);

  // configure Extensible callback handler 
  

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
