import express from 'express';
import {
  getOrCreateUser,
  updateUserProfile,
  getChatHistory,
  saveChat,
  deleteChat,
  searchChats
} from './userController.js';

const router = express.Router();

// User routes
router.get('/user', getOrCreateUser);
router.put('/user/profile', updateUserProfile);

// Chat history routes
router.get('/chats', getChatHistory);
router.post('/chats', saveChat);
router.delete('/chats/:chatId', deleteChat);
router.get('/chats/search', searchChats);

export default router;
