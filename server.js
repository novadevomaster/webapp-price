// 🚀 AI Project Manager WebApp Server
// Fast API with Smart Caching and Key Management

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🗄️ Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🚀 Smart Cache System
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
  useClones: false
});

// 🛡️ Rate Limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

// 🤖 AI API Keys Management
const API_KEYS = {
  gemini: {
    keys: [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean),
    currentIndex: 0,
    lastUsed: 0
  },
  gpt: {
    keys: [
      process.env.GPT_API_KEY_1,
      process.env.GPT_API_KEY_2,
      process.env.GPT_API_KEY_3
    ].filter(Boolean),
    currentIndex: 0,
    lastUsed: 0
  }
};

// 🎯 Smart Key Rotation
function getNextKey(provider) {
  const providerKeys = API_KEYS[provider];
  if (!providerKeys || providerKeys.keys.length === 0) {
    throw new Error(`No API keys configured for ${provider}`);
  }

  const now = Date.now();
  const keyCooldown = 1000; // 1 second between key switches

  // Switch keys if cooldown passed or current key failed
  if (now - providerKeys.lastUsed > keyCooldown) {
    providerKeys.currentIndex = (providerKeys.currentIndex + 1) % providerKeys.keys.length;
  }

  providerKeys.lastUsed = now;
  return providerKeys.keys[providerKeys.currentIndex];
}

// 🧠 Smart Query Processor
class QueryProcessor {
  static async processQuery(query) {
    // Check cache first
    const cacheKey = `query:${Buffer.from(query).toString('base64')}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Analyze query complexity
    const complexity = this.analyzeComplexity(query);
    
    // Route to appropriate AI
    let response;
    if (complexity.simple && complexity.quick) {
      response = await this.quickResponse(query);
    } else {
      response = await this.deepAnalysis(query);
    }

    // Cache the response
    cache.set(cacheKey, response);
    
    return response;
  }

  static analyzeComplexity(query) {
    const text = query.toLowerCase();
    return {
      simple: text.length < 100,
      quick: text.includes('what') || text.includes('how') || text.includes('list'),
      complex: text.length > 200 || text.includes('analyze') || text.includes('compare'),
      needsData: text.includes('project') || text.includes('data') || text.includes('statistics')
    };
  }

  static async quickResponse(query) {
    // Try Gemini first for quick responses
    try {
      return await this.callGemini(query, 'quick');
    } catch (error) {
      console.warn('Gemini failed, trying GPT:', error.message);
      return await this.callGPT(query, 'quick');
    }
  }

  static async deepAnalysis(query) {
    // Try GPT for complex analysis
    try {
      return await this.callGPT(query, 'detailed');
    } catch (error) {
      console.warn('GPT failed, trying Gemini:', error.message);
      return await this.callGemini(query, 'detailed');
    }
  }

  static async callGemini(query, mode = 'quick') {
    const key = getNextKey('gemini');
    const prompt = this.buildPrompt(query, mode, 'gemini');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    return {
      provider: 'gemini',
      response: response.data.candidates[0].content.parts[0].text,
      mode,
      timestamp: new Date().toISOString()
    };
  }

  static async callGPT(query, mode = 'quick') {
    const key = getNextKey('gpt');
    const prompt = this.buildPrompt(query, mode, 'gpt');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: mode === 'quick' ? 150 : 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return {
      provider: 'gpt',
      response: response.data.choices[0].message.content,
      mode,
      timestamp: new Date().toISOString()
    };
  }

  static buildPrompt(query, mode, provider) {
    const basePrompt = `You are an AI Project Manager assistant. Help users manage their software projects efficiently.`;
    
    if (mode === 'quick') {
      return `${basePrompt}\n\nUser query: ${query}\n\nProvide a quick, helpful response (max 100 words).`;
    } else {
      return `${basePrompt}\n\nUser query: ${query}\n\nProvide a detailed, structured response with actionable steps.`;
    }
  }
}

// 🛠️ Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 📊 Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache_stats: cache.getStats(),
    api_keys_status: {
      gemini: API_KEYS.gemini.keys.length,
      gpt: API_KEYS.gpt.keys.length
    }
  });
});

// 🤖 AI Query Endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    // Rate limiting
    await rateLimiter.consume(req.ip);
    
    const { query, context } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Process the query
    const response = await QueryProcessor.processQuery(query);
    
    // Log to Supabase for analytics
    try {
      await supabase.from('ai_queries').insert({
        query,
        response: response.response,
        provider: response.provider,
        from_cache: response.fromCache || false,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    } catch (logError) {
      console.warn('Failed to log to Supabase:', logError.message);
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('AI Query Error:', error);
    
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// 📈 Project Analysis Endpoint
app.post('/api/ai/analyze-project', async (req, res) => {
  try {
    const { projectPath, projectType } = req.body;
    
    // Check cache first
    const cacheKey = `analyze:${projectPath}:${projectType}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    // Build analysis prompt
    const prompt = `Analyze this ${projectType} project at ${projectPath}. Provide:
1. Technical stack analysis
2. Architecture recommendations
3. Performance optimizations
4. Security considerations
5. Deployment strategy`;

    const response = await QueryProcessor.processQuery(prompt);
    
    // Cache the analysis
    cache.set(cacheKey, response, 3600); // Cache for 1 hour
    
    res.json({ 
      success: true, 
      data: response,
      fromCache: false 
    });

  } catch (error) {
    console.error('Project Analysis Error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// 🎯 Smart Suggestions Endpoint
app.get('/api/ai/suggestions/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const cacheKey = `suggestions:${type}`;
    
    let suggestions = cache.get(cacheKey);
    if (!suggestions) {
      // Generate suggestions based on type
      const prompt = `Provide 5 smart suggestions for ${type} project management. Focus on efficiency and best practices.`;
      
      suggestions = await QueryProcessor.processQuery(prompt);
      cache.set(cacheKey, suggestions, 1800); // Cache for 30 minutes
    }

    res.json({ 
      success: true, 
      data: suggestions 
    });

  } catch (error) {
    console.error('Suggestions Error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// 📊 Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Analytics error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch analytics',
        details: error.message 
      });
    }

    const stats = {
      totalQueries: data?.length || 0,
      cacheHitRate: cache.getStats().hitRate || 0,
      apiUsage: {
        gpt: apiStats?.gpt || 0,
        gemini: apiStats?.gemini || 0
      },
      recentQueries: data?.slice(0, 10) || []
    };

    res.json(stats);
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 AI Project Manager Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Query endpoint: http://localhost:${PORT}/api/ai/query`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  cache.close();
  process.exit(0);
});

export default app;
