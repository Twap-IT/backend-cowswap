import { Router } from 'express';
import { EthersService } from '../services/ethers.service';

export const ethersRouter = Router();
const ethersService = new EthersService();

ethersRouter.get('/blockNumber', async (req, res) => {
  try {
    const blockNumber = await ethersService.getCurrentBlockNumber();
    res.json({ blockNumber });
  } catch (error) {
    res.status(500).send('Error fetching block number');
  }
});
