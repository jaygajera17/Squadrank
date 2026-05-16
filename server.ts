import express, { Application } from 'express';
import cors from 'cors';
import connectDB from './src/utils/db';
import router from './src/routes';
import { globalErrorHandler } from './src/middleware/errorHandler';
import { PORT } from './src/config/secrets';
import { connectRedis } from './src/config/redis';

const app: Application = express();

// -- Middleware --
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// -- Routes --
app.use('/api', router);

app.get("/",(req, res) => {
  res.send("Welcome to Squadrank API");
});

// -- 404 + Error Handlers --
app.use(globalErrorHandler);

// Redis connection
connectRedis();



const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;
