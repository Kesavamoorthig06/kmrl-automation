import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import AIChatService from '../../services/AIChatService';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your KMRL Metro AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Test connection when chatbot first opens
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      AIChatService.testConnection()
        .then(result => {
          console.log('AI Chat API connection test:', result);
          // Update the welcome message to show connection status
          if (result.success) {
            setMessages(prev => [{
              id: 1,
              text: "Hello! I'm your KMRL Metro AI advisor powered by Gemini AI. I don't just explain features - I provide comprehensive guidance, meaningful insights, and actionable solutions for your train operations. I'll analyze your data, anticipate your needs, and guide you toward optimal decisions. What would you like me to help you optimize today?",
              sender: 'bot',
              timestamp: new Date()
            }]);
          } else {
            setMessages(prev => [{
              id: 1,
              text: "Hello! I'm your KMRL Metro AI assistant. I'm ready to help you with train operations, maintenance, and system queries. How can I assist you today?",
              sender: 'bot',
              timestamp: new Date()
            }]);
          }
        })
        .catch(error => {
          console.error('AI Chat API connection test failed:', error);
          setMessages(prev => [{
            id: 1,
            text: "Hello! I'm your KMRL Metro AI assistant. I'm ready to help you with train operations, maintenance, and system queries. How can I assist you today?",
            sender: 'bot',
            timestamp: new Date()
          }]);
        });
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await AIChatService.sendMessage(inputText.trim());
      
      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.message,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error calling AI chat API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm experiencing a technical issue right now. This could be due to network connectivity or API limitations. Please try again in a moment, or contact the system administrator if the problem persists.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Spherical AI Assist Button */}
      <button
        onClick={toggleChat}
        className={`group fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          isOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
        }`}
        title="Open AI Assistant"
        style={{
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <MessageCircle 
            size={24} 
            className="text-white transition-all duration-300 group-hover:scale-110" 
          />
        </div>
        
        {/* Pulse animation ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-ping opacity-20"></div>
        
        {/* Notification dot */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>

      {/* Close Button - appears when chat is open */}
      {isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-red-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center justify-center"
          title="Close AI Assistant"
        >
          <X size={20} className="text-white" />
        </button>
      )}

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-500 transform animate-in slide-in-from-bottom-4 fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between border-b-2 border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white border-2 border-white rounded-full flex items-center justify-center">
                <MessageCircle size={16} className="text-black" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-wide uppercase">KMRL AI Advisor</span>
                <p className="text-xs text-gray-300">Powered by Gemini AI • Strategic Guidance & Optimization</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:bg-gray-800 rounded p-2 transition-colors duration-200"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:bg-gray-800 rounded p-2 transition-colors duration-200"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-white">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                      }`}
                    >
                      <p className="text-sm leading-relaxed" style={{
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}>{message.text}</p>
                      <p className="text-xs opacity-70 mt-2 font-medium tracking-wide uppercase">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 text-gray-800 border-2 border-blue-200 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about dashboard metrics, train performance, deployment monitoring, or system analytics..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-sm"
                    disabled={isLoading}
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="px-4 py-3 bg-white text-black border-2 border-black rounded-none hover:bg-black hover:text-white disabled:bg-gray-400 disabled:border-gray-400 disabled:text-gray-600 disabled:hover:bg-gray-400 disabled:hover:text-gray-600 transition-all duration-200 flex items-center space-x-1 text-sm font-medium"
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatbot;
