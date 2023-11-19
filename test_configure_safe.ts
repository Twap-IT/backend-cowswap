

import { ethers } from 'ethers';
import wethABI from "./abis/weth.json";
import Safe, { SafeFactory, SafeAccountConfig, EthersAdapter, PredictedSafeProps } from '@safe-global/protocol-kit';
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import SafeApiKit from '@safe-global/api-kit';


import dotenv from 'dotenv';
dotenv.config();

const main = async () => { 
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(provider);

  const address = wallet.address;

  const safeAddress = "0x0eEF82D4082549c7E84A36aF98B0A90792D1f3e3";

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: wallet
  })
  const safeSdk = await Safe.create({ethAdapter, safeAddress})


  const safeAccountConfig: SafeAccountConfig = {
    owners: [address],
    threshold: 1,
    fallbackHandler: process.env.EXTENSIBLE_FALLBACK_HANDLER_ADDRESS
  }

  const contractABI = [
    "function setDomainVerifier(bytes32 domainSeparator, address newVerifier)"
  ];

  // Create an Interface instance
  const contractInterface = new ethers.utils.Interface(contractABI);

  // Function name and arguments
  const functionName = 'setDomainVerifier';


  // Encode the function call
  const calldata = contractInterface.encodeFunctionData(functionName, [process.env.COWSWAP_SETTLEMENT_DOMAIN_SEPARATOR, process.env.COMPOSABLE_COW_ADDRESS]);

  console.log('calldata', calldata)
  const safeTransactionData: SafeTransactionDataPartial = {
    to: safeAddress,
    data: calldata,
    value: "0",
  }

  const safeTransaction = await safeSdk.createTransaction({ safeTransactionData });
  console.log(safeTransaction);

  const executeTxResponse = await safeSdk.executeTransaction(safeTransaction);
  await executeTxResponse.transactionResponse?.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
