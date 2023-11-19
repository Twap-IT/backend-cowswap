

import { ethers } from 'ethers';
import erc20Abi from "./abis/erc20.json";
import composableCoWAbi from "./abis/composableCoW.json";
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';


import dotenv from 'dotenv';
dotenv.config();

const main = async () => { 
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(provider);

  const address = wallet.address;

  const safeAddress = "<YOUR SAFE ADDRESS HERE>"; // minimum - 5 WXDAI
  const buyTokenAddress = "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"; // WETH on GnosisChain
  const sellTokenAddress = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"; // WXDAI on GnosisChain
  const twapOrderAddress = "0x6cF1e9cA41f7611dEf408122793c358a3d11E5a5" // TWAP order handler

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: wallet
  })
  const safeSdk = await Safe.create({ethAdapter, safeAddress})

  const sellTokenInterface = new ethers.utils.Interface(erc20Abi);
  const sellTokenContract = new ethers.Contract(sellTokenAddress, erc20Abi, wallet);
  const composableOrderContractInterface = new ethers.utils.Interface(composableCoWAbi)
  const sellTokenBalance = await sellTokenContract.balanceOf(safeAddress)

  // Encode the approve  function call
  const approveCalldata = sellTokenInterface.encodeFunctionData("approve", [process.env.GNOSIS_V2_VAULT_RELAYER_ADDRES!, sellTokenBalance]);

  const numSells = 5; // number of sell orders
  const sellIntervalInSeconds = 300 // sell every 5 minutes

  /*
  const twapParams = {
    sellToken: sellTokenAddress,
    buyToken: buyTokenAddress,
    receiver: "0x0000000000000000000000000000000000000000", // address(0) if the safe
    partSellAMount: sellTokenBalance.div(numSells), // amount to sell in each part
    minPartLimit: sellTokenBalance.div(numSells).div(1950).mul(9).div(10), // minimum buy amount in each part. For demo assume price of eth is ~1950 WXDAI and give 10% buffer
    t0: (await provider.getBlock('latest')).timestamp + 100,
    n: numSells, // split into 5 orders
    t: sellIntervalInSeconds,
    span: numSells * sellIntervalInSeconds + 1000, // leave a little buffer for order fullfillment
  }
  */
  const twapParams = [
    sellTokenAddress, 
    buyTokenAddress, 
    "0x0000000000000000000000000000000000000000", 
    sellTokenBalance.div(numSells), 
    sellTokenBalance.div(numSells).div(1950).mul(9).div(10),
    (await provider.getBlock('latest')).timestamp + 100,
    numSells,
    sellIntervalInSeconds,
    numSells * sellIntervalInSeconds + 1000
  ]
  const twapParamsType = ["string", "string", "string", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"];

  const encodedData = ethers.utils.defaultAbiCoder.encode(twapParamsType, twapParams);

  const conditionalTWAPOrderParams = {
    handler: twapOrderAddress,
    staticInput: encodedData,
    salt: ethers.utils.hexZeroPad(ethers.utils.hexlify(Math.floor(Math.random() * 100000)), 32) // random 
  };

  // Encode the twap function call
  const createTWAPCalldata = composableOrderContractInterface.encodeFunctionData("create", [conditionalTWAPOrderParams, true]);
  console.log('calldata', createTWAPCalldata)
 
  const approveTransactionData: SafeTransactionDataPartial = {
    to: sellTokenAddress,
    data: approveCalldata,
    value: "0",
  };

  const twapTransactionData: SafeTransactionDataPartial = {
    to: process.env.COMPOSABLE_COW_ADDRESS!,
    data: createTWAPCalldata,
    value: "0",
  };

  const safeTransactionData: MetaTransactionData[] = [
    approveTransactionData,
    twapTransactionData
  ]

  const safeTransaction = await safeSdk.createTransaction({ safeTransactionData });
  console.log('multisend tx', safeTransaction);

  const executeTxResponse = await safeSdk.executeTransaction(safeTransaction);
  await executeTxResponse.transactionResponse?.wait();
  console.log('twap order successfully created - ', executeTxResponse);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
