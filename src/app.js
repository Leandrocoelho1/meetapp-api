import dotenv from 'dotenv';
import express from 'express';
import * as Sentry from '@sentry/node';
import Youch from 'youch';
import cors from 'cors';
import { resolve } from 'path';

import 'express-async-errors';
import './database';
import sentryConfig from './config/sentry';
import routes from './routes';

Sentry.init(sentryConfig);
dotenv.config();

const app = express();

app.use(Sentry.Handlers.requestHandler());
app.use(cors());
app.use(express.json());
app.use('/files', express.static(resolve(__dirname, '..', 'tmp', 'uploads')));
app.use(routes);
app.use(Sentry.Handlers.errorHandler());

app.use(async (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const errors = await new Youch(err, req).toJSON();

    return res.status(500).json(errors);
  }

  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
