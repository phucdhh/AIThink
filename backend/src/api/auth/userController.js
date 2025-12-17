import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_DIR = path.join(__dirname, '../../../../users');

// Ensure users directory exists
async function ensureUsersDir() {
  try {
    await fs.mkdir(USERS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating users directory:', error);
  }
}

// Generate unique user ID
function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

// Get or create guest user
export async function getOrCreateUser(req, res) {
  try {
    await ensureUsersDir();
    
    // Check if user has session
    let userId = req.headers['x-user-id'];
    
    if (!userId) {
      // Create new guest user
      userId = generateUserId();
      const userDir = path.join(USERS_DIR, userId);
      
      await fs.mkdir(userDir, { recursive: true });
      await fs.mkdir(path.join(userDir, 'chats'), { recursive: true });
      
      const userData = {
        userId,
        username: `Guest_${userId.substring(0, 8)}`,
        avatar: null,
        createdAt: new Date().toISOString(),
        theme: 'light'
      };
      
      await fs.writeFile(
        path.join(userDir, 'profile.json'),
        JSON.stringify(userData, null, 2)
      );
      
      console.log('✅ Created new guest user:', userId);
      return res.json(userData);
    }
    
    // Load existing user
    const userDir = path.join(USERS_DIR, userId);
    const profilePath = path.join(userDir, 'profile.json');
    
    try {
      const profileData = await fs.readFile(profilePath, 'utf-8');
      const userData = JSON.parse(profileData);
      return res.json(userData);
    } catch (error) {
      // User ID exists but no profile, recreate
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update user profile
export async function updateUserProfile(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { username, avatar, theme } = req.body;
    const userDir = path.join(USERS_DIR, userId);
    const profilePath = path.join(userDir, 'profile.json');
    
    const profileData = await fs.readFile(profilePath, 'utf-8');
    const userData = JSON.parse(profileData);
    
    if (username) userData.username = username;
    if (avatar !== undefined) userData.avatar = avatar;
    if (theme) userData.theme = theme;
    userData.updatedAt = new Date().toISOString();
    
    await fs.writeFile(profilePath, JSON.stringify(userData, null, 2));
    
    res.json(userData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user chat history
export async function getChatHistory(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const chatsDir = path.join(USERS_DIR, userId, 'chats');
    const files = await fs.readdir(chatsDir);
    
    const chats = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const chatPath = path.join(chatsDir, file);
          const chatData = await fs.readFile(chatPath, 'utf-8');
          return JSON.parse(chatData);
        })
    );
    
    // Sort by timestamp, most recent first
    chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(chats);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Save chat conversation
export async function saveChat(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { chatId, title, messages } = req.body;
    
    if (!chatId || !messages) {
      return res.status(400).json({ error: 'chatId and messages required' });
    }
    
    const chatsDir = path.join(USERS_DIR, userId, 'chats');
    await fs.mkdir(chatsDir, { recursive: true });
    
    const chatData = {
      chatId,
      title: title || messages[0]?.content?.substring(0, 50) || 'New Chat',
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const chatPath = path.join(chatsDir, `${chatId}.json`);
    await fs.writeFile(chatPath, JSON.stringify(chatData, null, 2));
    
    res.json({ success: true, chatId });
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete chat
export async function deleteChat(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { chatId } = req.params;
    const chatPath = path.join(USERS_DIR, userId, 'chats', `${chatId}.json`);
    
    await fs.unlink(chatPath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Search chats
export async function searchChats(req, res) {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const chatsDir = path.join(USERS_DIR, userId, 'chats');
    const files = await fs.readdir(chatsDir);
    
    const searchResults = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const chatPath = path.join(chatsDir, file);
      const chatData = JSON.parse(await fs.readFile(chatPath, 'utf-8'));
      
      // Search in title and messages
      const titleMatch = chatData.title?.toLowerCase().includes(query.toLowerCase());
      const contentMatch = chatData.messages?.some(msg => 
        msg.content?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (titleMatch || contentMatch) {
        searchResults.push(chatData);
      }
    }
    
    searchResults.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
