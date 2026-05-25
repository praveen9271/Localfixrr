const crypto = require('crypto');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const { getGeminiReply } = require('../services/geminiService');

const cleanMessage = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const isDbConnected = () => mongoose.connection.readyState === 1;

const getChatHistory = async (sessionId) => {
  if (!isDbConnected() || !sessionId) return [];

  const chat = await Chat.findOne({ sessionId }).lean();
  return chat?.messages || [];
};

const saveChatExchange = async ({ sessionId, userMessage, assistantMessage, userId }) => {
  if (!isDbConnected()) return;

  const now = new Date();
  await Chat.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        lastMessageAt: now,
        ...(userId ? { user: userId } : {}),
      },
      $push: {
        messages: {
          $each: [
            { role: 'user', text: userMessage, createdAt: now },
            { role: 'assistant', text: assistantMessage, createdAt: new Date() },
          ],
          $slice: -80,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const sendChatMessage = async (req, res) => {
  try {
    const message = cleanMessage(req.body.message);
    const sessionId = cleanMessage(req.body.sessionId) || crypto.randomUUID();

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Message is too long. Please keep it under 1000 characters.' });
    }

    const history = await getChatHistory(sessionId);
    const aiResponse = await getGeminiReply({ message, history });
    const reply = cleanMessage(aiResponse.reply);

    await saveChatExchange({
      sessionId,
      userMessage: message,
      assistantMessage: reply,
      userId: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      sessionId,
      reply,
      provider: aiResponse.provider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      message: 'LocalFixr AI is unavailable right now. Please try again shortly.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

module.exports = {
  sendChatMessage,
};
