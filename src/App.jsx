// 🚀 AI Project Manager WebApp - Frontend
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bot, MessageSquare, BarChart3, Zap, Shield, Settings, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// 🗄️ Supabase Client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  // 🔄 Load initial data
  useEffect(() => {
    loadHealthCheck();
    loadAnalytics();
  }, []);

  const loadHealthCheck = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Analytics failed:', error);
    }
  };

  // 🤖 Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.data.response,
          provider: data.data.provider,
          fromCache: data.data.fromCache,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      loadAnalytics(); // Refresh analytics
    }
  };

  // 🎯 Quick actions
  const quickActions = [
    { 
      label: 'Analyze Project', 
      action: 'Analyze my current project structure and suggest improvements',
      icon: <BarChart3 className="w-4 h-4" />
    },
    { 
      label: 'Performance Tips', 
      action: 'Give me performance optimization tips for React apps',
      icon: <Zap className="w-4 h-4" />
    },
    { 
      label: 'Security Check', 
      action: 'Check my project for common security vulnerabilities',
      icon: <Shield className="w-4 h-4" />
    }
  ];

  const handleQuickAction = (action) => {
    setInput(action);
    // Auto-send after setting input
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.getElementById('chat-input')?.dispatchEvent(event);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Project Manager
              </h1>
            </div>
            
            {/* Health Status */}
            {health && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-slate-300">API: {health.status}</span>
                </div>
                <div className="text-slate-400">
                  Cache: {health.cache_stats?.hits || 0} hits
                </div>
                <div className="text-slate-400">
                  Keys: GPT:{health.api_keys_status?.gpt || 0} Gemini:{health.api_keys_status?.gemini || 0}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 h-[600px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                      <Bot className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg mb-2">Welcome to AI Project Manager!</p>
                      <p className="text-sm">Ask me anything about your projects, development, or best practices.</p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-lg px-4 py-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.type === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {message.type === 'ai' && (
                            <div className="flex items-center space-x-2 mt-2 text-xs opacity-70">
                              <span>{message.provider}</span>
                              {message.fromCache && <span className="text-green-400">⚡ Cached</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-slate-700 p-4">
                  <div className="flex space-x-2">
                    <input
                      id="chat-input"
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask about your project, development, or best practices..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="w-full flex items-center space-x-3 bg-slate-700 hover:bg-slate-600 rounded-lg p-3 transition-colors text-left"
                    >
                      {action.icon}
                      <span className="text-sm">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Stats */}
                {analytics && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h4 className="text-sm font-semibold mb-3 text-slate-300">Session Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Queries:</span>
                        <span className="text-slate-200">{analytics.total_queries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cache Hit Rate:</span>
                        <span className="text-green-400">{analytics.cache_hit_rate?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-200">Analytics Dashboard</h2>
            
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Queries</p>
                      <p className="text-2xl font-bold text-slate-200">{analytics.total_queries}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Cache Hit Rate</p>
                      <p className="text-2xl font-bold text-green-400">
                        {analytics.cache_hit_rate?.toFixed(1)}%
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">GPT Usage</p>
                      <p className="text-2xl font-bold text-slate-200">
                        {analytics.providers?.gpt || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Gemini Usage</p>
                      <p className="text-2xl font-bold text-slate-200">
                        {analytics.providers?.gemini || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p>Loading analytics...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-200">Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-slate-300">API Configuration</h3>
                <p className="text-slate-400 text-sm">
                  Configure your API keys in the .env file for optimal performance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-slate-300">Cache Settings</h3>
                <p className="text-slate-400 text-sm">
                  Responses are cached for 5 minutes to improve performance and reduce API usage.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 text-slate-300">Rate Limiting</h3>
                <p className="text-slate-400 text-sm">
                  10 requests per minute per IP to ensure fair usage.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
