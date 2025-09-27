import NetlifyAPIService from './NetlifyAPIService';

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.isTyping = false;
  }

  async sendMessage(message) {
    try {
      this.isTyping = true;
      
      // Add user message to history
      this.conversationHistory.push({
        type: 'user',
        message,
        timestamp: new Date()
      });

      // Send to API
      const response = await NetlifyAPIService.chatWithBot(message, {
        history: this.conversationHistory.slice(-5) // Send last 5 messages for context
      });

      if (response.success) {
        const botMessage = {
          type: 'bot',
          message: response.data.message,
          suggestions: response.data.suggestions || [],
          timestamp: new Date()
        };

        this.conversationHistory.push(botMessage);
        this.isTyping = false;
        
        return botMessage;
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.isTyping = false;
      
      const errorMessage = {
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        suggestions: ['Ask about train status', 'Check maintenance updates', 'View system performance'],
        timestamp: new Date(),
        error: true
      };

      this.conversationHistory.push(errorMessage);
      return errorMessage;
    }
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  isBotTyping() {
    return this.isTyping;
  }

  // Get quick suggestions based on current context
  getQuickSuggestions() {
    const suggestions = [
      'What is the current train status?',
      'How many trains are under maintenance?',
      'Show me system efficiency metrics',
      'What are the current violations?',
      'Tell me about deployment optimization',
      'What is the cost breakdown?'
    ];

    return suggestions;
  }

  // Get contextual suggestions based on conversation
  getContextualSuggestions() {
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    
    if (!lastMessage || lastMessage.type === 'user') {
      return this.getQuickSuggestions();
    }

    // Return suggestions from the last bot response
    return lastMessage.suggestions || this.getQuickSuggestions();
  }
}

export default new ChatbotService();
