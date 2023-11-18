import express from 'express';
import { ethersRouter } from './routes/ethers.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/ethers', ethersRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
