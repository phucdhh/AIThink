const DB_NAME = 'aithink_db';
const DB_VERSION = 1;
const CHATS_STORE = 'chats';

let db = null;

function openDB() {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(CHATS_STORE)) {
        const store = database.createObjectStore(CHATS_STORE, { keyPath: 'chatId' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function getAllChats() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CHATS_STORE, 'readonly');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const chats = request.result || [];
      chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      resolve(chats);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveChat({ chatId, messages }) {
  const database = await openDB();
  return new Promise(async (resolve, reject) => {
    // Read existing chat to preserve createdAt
    const existing = await getChatById(chatId).catch(() => null);
    const now = new Date().toISOString();
    const title = messages.find(m => m.role === 'user')?.content?.substring(0, 60) || 'New Chat';

    const chatData = {
      chatId,
      title,
      messages,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const transaction = database.transaction(CHATS_STORE, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.put(chatData);
    request.onsuccess = () => resolve({ success: true, chatId });
    request.onerror = () => reject(request.error);
  });
}

export async function getChatById(chatId) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CHATS_STORE, 'readonly');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.get(chatId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteChat(chatId) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CHATS_STORE, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE);
    const request = store.delete(chatId);
    request.onsuccess = () => resolve({ success: true });
    request.onerror = () => reject(request.error);
  });
}

export async function searchChats(query) {
  const chats = await getAllChats();
  const lower = query.toLowerCase();
  return chats.filter(
    (chat) =>
      chat.title?.toLowerCase().includes(lower) ||
      chat.messages?.some((m) => m.content?.toLowerCase().includes(lower))
  );
}
