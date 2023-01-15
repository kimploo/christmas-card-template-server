import express from 'express';
import authController from '@auth/auth.controller';
import cardController from './card/card.controller';

const authRouter = express.Router();
const cardRouter = express.Router();

// authRouter.post('/', authController.auth);
authRouter.get('/', authController.auth);
cardRouter.get('/', cardController.findMany);
cardRouter.get('/:id', cardController.findOne);
cardRouter.post('/', cardController.createOne);
cardRouter.put('/:id', cardController.updateOne);
cardRouter.delete('/:id', cardController.deleteOne);

export { authRouter, cardRouter };
