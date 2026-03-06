import React, { useState } from 'react';
import ChatApiService from '../services/ChatApiService';

function ChatTest() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCreateConversation = async () => {
    setLoading(true);
    try {
      const response = await ChatApiService.createDirectConversation('user123', 'user456');
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSendMessage = async () => {
    setLoading(true);
    try {
      // First create a conversation
      const conversation = await ChatApiService.createDirectConversation('user123', 'user456');
      
      // Then send a message
      const messageData = {
        senderId: 'user123',
        messageType: 'text',
        content: { text: 'Hello from frontend!' }
      };
      
      const response = await ChatApiService.sendMessage(conversation.conversation._id, messageData);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Chat API Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testCreateConversation} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Test Create Conversation
        </button>
        
        <button 
          onClick={testSendMessage} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          Test Send Message
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        overflow: 'auto',
        maxHeight: '400px'
      }}>
        {result}
      </pre>
    </div>
  );
}

export default ChatTest;
