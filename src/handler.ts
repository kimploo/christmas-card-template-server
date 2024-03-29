import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { authRouter, cardRouter, loginRouter, logoutRouter, artworkRouter } from './router';
import cookieUtil from '@/util/cookie';

dotenv.config();
const app = express();

const isDev = process.env.IS_OFFLINE;
const corsOrigin = isDev
  ? ['https://localhost:5173', 'http://localhost:5173']
  : ['https://hyodee-card.surge.sh', /\.teamhh\.link$/];

app.use(
  cors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With', 'Range', 'baggage', 'sentry-trace'],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/auth', authRouter);
app.use('/card', cardRouter);
app.use('/artwork', artworkRouter);

app.get('/', (_, res) => {
  return res.status(200).json({
    message: 'health check',
  });
});

app.use((_, res) => {
  cookieUtil.clear(res);
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverless(app);
