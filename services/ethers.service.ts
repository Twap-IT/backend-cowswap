import { ethers } from 'ethers';

export class EthersService {
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    const rpcUrl = process.env.ETH_RPC_URL || 'http://localhost:8545'; // Your Ethereum RPC URL
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async getCurrentBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }
}


