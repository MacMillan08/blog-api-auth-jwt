import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import userController from './controllers/UserController';
import authController from './controllers/AuthController';
import categoryController from './controllers/CategoryController';
import postController from './controllers/PostController';
import tagController from './controllers/TagController';
import postTagController from './controllers/PostTagController';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Blog API Calisiyor');
});

app.use('/users', userController);
app.use('/auth', authController);
app.use('/categories', categoryController);
app.use('/posts', postController);
app.use('/tags', tagController);
app.use('/posts/:postId/tags', postTagController);

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde baslatildi.`);
});