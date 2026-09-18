import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Leaf, Droplets, MapPin, Sprout, Activity, Beaker, AlertCircle, CheckCircle2 } from 'lucide-react';
import './App.css';

const API_URL = "http://localhost:8000";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState({
    soil_organic_carbon: null,
    soil_ph: null,
    rainfall: null,
    land_use: null,
    crop_type: null,
    region: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: input,
        history: messages,
        state: state
      });
      
      const data = response.data;
      setState(data.updated_state);
      
      const assistantMessage = { 
        role: "assistant", 
        content: data.response,
        recommendation: data.recommendation_data 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the Darukaa Intelligence engine. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value === "" ? null : name.includes("soil_") ? parseFloat(value) : value
    }));
  };

  return (
    <div className="layout">
      {/* Sidebar / Settings Pane */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-icon"><Leaf size={24} color="#059669" /></div>
          <h2>Darukaa.Earth</h2>
        </div>
        
        <div className="state-panel">
          <h3>Environmental Profile</h3>
          <p className="subtitle">Contextual data for precision RAG</p>
          
          <div className="input-group">
            <label><Activity size={16} /> Soil Organic Carbon (%)</label>
            <input type="number" step="0.1" name="soil_organic_carbon" value={state.soil_organic_carbon || ""} onChange={handleStateChange} placeholder="e.g. 0.3" />
          </div>
          <div className="input-group">
            <label><Beaker size={16} /> Soil pH</label>
            <input type="number" step="0.1" name="soil_ph" value={state.soil_ph || ""} onChange={handleStateChange} placeholder="e.g. 6.5" />
          </div>
          <div className="input-group">
            <label><Droplets size={16} /> Rainfall</label>
            <input type="text" name="rainfall" value={state.rainfall || ""} onChange={handleStateChange} placeholder="e.g. low, moderate" />
          </div>
          <div className="input-group">
            <label><MapPin size={16} /> Land Use</label>
            <input type="text" name="land_use" value={state.land_use || ""} onChange={handleStateChange} placeholder="e.g. monoculture" />
          </div>
          <div className="input-group">
            <label><Sprout size={16} /> Crop Type</label>
            <input type="text" name="crop_type" value={state.crop_type || ""} onChange={handleStateChange} placeholder="e.g. wheat, corn" />
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="dot pulse"></span> AI Engine Online
          </div>
        </div>
      </aside>
      
      {/* Main Chat Interface */}
      <main className="main-content">
        <header className="chat-header">
          <h1>Biodiversity Intelligence Chat</h1>
          <p>Powered by multi-metric RAG and Google Gemini</p>
        </header>

        <div className="chat-container">
          <div className="messages-area">
            {messages.length === 0 && (
              <div className="empty-state">
                <Leaf size={48} className="empty-icon" />
                <h2>Welcome to your AI Environmental Scientist</h2>
                <p>Describe the biodiversity issues on your land, or update your environmental profile on the left to get started.</p>
              </div>
            )}
            
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`message-wrapper ${msg.role}`}
                >
                  <div className="avatar">
                    {msg.role === 'assistant' ? <Leaf size={18} /> : <span>U</span>}
                  </div>
                  <div className="message-content">
                    <div className="text-bubble">{msg.content}</div>
                    
                    {msg.recommendation && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="recommendation-card"
                      >
                        <div className="rec-header">
                          <CheckCircle2 size={18} color="#059669" />
                          <h4>Evidence-Backed Action Plan</h4>
                        </div>
                        <div className="rec-body">
                          <div className="rec-row">
                            <span className="label">Intervention:</span>
                            <span className="value font-semibold">{msg.recommendation.recommendation}</span>
                          </div>
                          <div className="rec-row">
                            <span className="label">Scientific Reasoning:</span>
                            <span className="value">{msg.recommendation.scientific_reasoning}</span>
                          </div>
                          <div className="rec-row">
                            <span className="label">Metrics Impacted:</span>
                            <span className="value tags">
                              {msg.recommendation.impacted_metrics.map(m => (
                                <span key={m} className="tag">{m}</span>
                              ))}
                            </span>
                          </div>
                          <div className="rec-row">
                            <span className="label">Horizon:</span>
                            <span className="value">{msg.recommendation.time_horizon}</span>
                          </div>
                          <div className="rec-source">
                            <AlertCircle size={14} />
                            Source: {msg.recommendation.evidence_source}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-wrapper assistant loading">
                <div className="avatar"><Leaf size={18} /></div>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </motion.div>
            )}
            
            {error && (
              <div className="error-toast">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-container">
            <div className="input-box">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about improving your ecosystem..."
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send size={18} />
              </button>
            </div>
            <p className="disclaimer">AI can make mistakes. Verify scientific claims with local agronomists.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
