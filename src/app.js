import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { resolve } from 'path';

import './database';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/files', express.static(resolve(__dirname, '..', 'tmp', 'uploads')));
app.use(routes);

export default app;
