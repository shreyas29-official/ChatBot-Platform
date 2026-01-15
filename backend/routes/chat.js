const express = require('express');
const axios = require('axios');
const Project = require('../models/Project');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const validateInput = require('../middleware/validation');
const { cacheMiddleware } = require('../middleware/cache');
const router = express.Router();

// Apply rate limiting to all chat routes
router.use(chatLimiter);

// Get chat history for a project (with caching)
router.get('/:projectId/messages', auth, cacheMiddleware(60), async (req, res) => {
  try {
    // Verify project belongs to user
    const project = await Project.findOne({ _id: req.params.projectId, userId: req.user.userId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ createdAt: 1 })
      .limit(100); // Limit messages for performance
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message and get AI response (with optional image analysis)
router.post('/:projectId/messages', auth, validateInput, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, imageUrl } = req.body;
    const projectId = req.params.projectId;

    // Input validation
    if (!message && !imageUrl) {
      return res.status(400).json({ error: 'Message or image required' });
    }

    console.log('Chat request:', { projectId, messageLength: message?.length, hasImage: !!imageUrl, userId: req.user.userId });

    // Verify project belongs to user with caching
    const project = await Project.findOne({ _id: projectId, userId: req.user.userId }).lean();
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Save user message
    const userMessage = new Message({
      projectId,
      role: 'user',
      content: message || 'Image analysis request'
    });
    await userMessage.save();

    // Get recent conversation history (last 20 messages for performance)
    const messages = await Message.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const recentMessages = messages.reverse();

    // Prepare messages for OpenRouter
    let openRouterMessages = [
      { role: 'system', content: project.systemPrompt || 'You are a helpful assistant.' },
      ...recentMessages.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    // Use vision model if image is provided
    const model = imageUrl ? 'google/gemini-pro-vision' : 'meta-llama/llama-3.1-8b-instruct';
    
    // If image is provided, modify the last message to include image
    if (imageUrl) {
      const lastMessage = openRouterMessages[openRouterMessages.length - 1];
      lastMessage.content = [
        { type: 'text', text: message || 'Analyze this image' },
        { type: 'image_url', image_url: { url: imageUrl } }
      ];
    }

    console.log('OpenRouter request:', { model, messageCount: openRouterMessages.length, hasImage: !!imageUrl });

    // Call OpenRouter API with timeout
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: openRouterMessages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'Chatbot Platform'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const aiResponse = openRouterResponse.data.choices[0].message.content;
    const responseTime = Date.now() - startTime;
    
    console.log('OpenRouter response received:', { 
      responseLength: aiResponse.length, 
      responseTime: `${responseTime}ms` 
    });

    // Save AI response
    const assistantMessage = new Message({
      projectId,
      role: 'assistant',
      content: aiResponse
    });
    await assistantMessage.save();

    res.json(assistantMessage);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Chat error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      responseTime: `${responseTime}ms`
    });
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout. Please try again.' });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'AI service rate limit exceeded. Please wait a moment.' });
    }
    
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
});

// Clear chat history
router.delete('/:projectId/messages', auth, async (req, res) => {
  try {
    // Verify project belongs to user
    const project = await Project.findOne({ _id: req.params.projectId, userId: req.user.userId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await Message.deleteMany({ projectId: req.params.projectId });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;