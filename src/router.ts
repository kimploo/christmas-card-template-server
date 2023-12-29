import express from 'express';
import authController from '@auth/auth.controller';
import cardController from './card/card.controller';
import { authFunc } from './middleware/auth';

const loginRouter = express.Router();
const logoutRouter = express.Router();
const authRouter = express.Router();
const cardRouter = express.Router();

const isDev = process.env.IS_OFFLINE;
const auth = isDev ? (_: any, __: any, next: () => any) => next() : authFunc;

// authRouter.post('/', authController.auth);
loginRouter.get('/', authController.login);
logoutRouter.post('/', authController.logout);
authRouter.get('/', authController.auth);
cardRouter.get('/', auth, cardController.findMany);
cardRouter.get('/:uuid', cardController.findOne);
cardRouter.post('/', auth, cardController.createOne);
cardRouter.put('/:id', auth, cardController.updateOne);
cardRouter.delete('/:id', auth, cardController.deleteOne);

export { authRouter, cardRouter, loginRouter, logoutRouter };
