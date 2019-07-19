import dotenv from 'dotenv';
import express from 'express';

import './database';
import routes from './routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use(routes);

export default app;
