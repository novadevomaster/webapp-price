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
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // 📊 Load analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  // 🤖 Handle AI Query
  const handleQuery = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue })
      });

      const data = await response.json();
      
      const aiMessage = { role: 'assistant', content: data.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' 
      }]);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  // 🔍 Handle Project Search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const results = searchProjects(searchQuery, selectedCategory || null);
    setSearchResults(results);
  };

  // 📊 Render Analytics Dashboard
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600 ml-3" />
            <h3 className="text-lg font-semibold text-gray-900">إجمالي الاستفسارات</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{analytics?.totalQueries || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 ml-3" />
            <h3 className="text-lg font-semibold text-gray-900">نسبة التخزين المؤقت</h3>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{analytics?.cacheHitRate || 0}%</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600 ml-3" />
            <h3 className="text-lg font-semibold text-gray-900">استخدام GPT</h3>
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
