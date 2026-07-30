import express from 'express';
import cors from 'cors';
import { router } from '../backend/src/routes/routes';
import { authRouter } from '../backend/src/routes/auth';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRouter);
app.use('/api', router);

export default app;
