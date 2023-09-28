import express from 'express';
import authController from '@auth/auth.controller';
import cardController from './card/card.controller';
import { authFunc } from './middleware/auth';

const loginRouter = express.Router();
const logoutRouter = express.Router();
const authRouter = express.Router();
const cardRouter = express.Router();

// authRouter.post('/', authController.auth);
loginRouter.get('/', authController.login);
logoutRouter.post('/', authController.logout);
authRouter.get('/', authController.auth);
cardRouter.get('/', authFunc, cardController.findMany);
cardRouter.get('/:uuid', cardController.findOne);
cardRouter.post('/', authFunc, cardController.createOne);
cardRouter.put('/:id', authFunc, cardController.updateOne);
cardRouter.delete('/:id', authFunc, cardController.deleteOne);

export { authRouter, cardRouter, loginRouter, logoutRouter };
