import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

import { authRouter, cardRouter } from './router';
import { KakaoUserInfo } from '@customType/kakaoRes';
import { authFunc } from './middleware/auth';

const prisma = new PrismaClient();
dotenv.config();
const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://localhost:5173', 'https://hyodee.card.surge.sh'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use('/auth', authRouter);
app.use('/card', authFunc, cardRouter);

app.get('/', (_, res) => {
  return res.status(200).json({
    message: 'health check',
  });
});

app.use((_, res) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverless(app);
