const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test data
const user1 = {
  userId: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  bio: 'Software developer'
};

const user2 = {
  userId: 'user456', 
  name: 'Jane Smith',
  email: 'jane@example.com',
  bio: 'Designer'
};

async function runChatTests() {
  try {
    console.log('🚀 Starting Chat API Tests...\n');
    
    // 1. Create users
    console.log('1. Creating users...');
    await axios.post(`${API_BASE}/profile`, user1);
    await axios.post(`${API_BASE}/profile`, user2);
    console.log('✅ Users created\n');
    
    // 2. Create direct conversation
    console.log('2. Creating direct conversation...');
    const convResponse = await axios.post(`${API_BASE}/chat/conversations/direct`, {
      user1Id: user1.userId,
      user2Id: user2.userId
    });
    const conversationId = convResponse.data.conversation._id;
    console.log(`✅ Conversation created: ${conversationId}\n`);
    
    // 3. Send messages
    console.log('3. Sending messages...');
    
    // User1 sends message
    const msg1Response = await axios.post(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      senderId: user1.userId,
      messageType: 'text',
      content: {
        text: 'Hello Jane! How are you doing?'
      }
    });
    console.log(`✅ Message 1 sent: "${msg1Response.data.message.content.text}"`);
    
    // User2 replies
    const msg2Response = await axios.post(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      senderId: user2.userId,
      messageType: 'text',
      content: {
        text: 'Hi John! I\'m doing great, thanks for asking!'
      },
      replyTo: {
        messageId: msg1Response.data.message._id,
        senderId: user1.userId,
        text: 'Hello Jane! How are you doing?'
      }
    });
    console.log(`✅ Message 2 sent as reply: "${msg2Response.data.message.content.text}"\n`);
    
    // 4. Get conversations for user1
    console.log('4. Getting conversations for user1...');
    const convListResponse = await axios.get(`${API_BASE}/chat/conversations?userId=${user1.userId}`);
    console.log(`✅ Found ${convListResponse.data.conversations.length} conversations`);
    console.log(`   Unread count: ${convListResponse.data.conversations[0].unreadCount}\n`);
    
    // 5. Get messages in conversation
    console.log('5. Getting messages in conversation...');
    const messagesResponse = await axios.get(`${API_BASE}/chat/conversations/${conversationId}/messages`);
    console.log(`✅ Found ${messagesResponse.data.messages.length} messages:`);
    messagesResponse.data.messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.senderId}: "${msg.content.text}"`);
      if (msg.replyTo) {
        console.log(`      (Reply to: "${msg.replyTo.text}")`);
      }
    });
    console.log('');
    
    // 6. Add reaction
    console.log('6. Adding reaction to first message...');
    await axios.post(`${API_BASE}/chat/messages/${msg1Response.data.message._id}/reactions`, {
      userId: user2.userId,
      emoji: '👍'
    });
    console.log('✅ Reaction added\n');
    
    // 7. Mark as read
    console.log('7. Marking messages as read for user1...');
    await axios.patch(`${API_BASE}/chat/conversations/${conversationId}/read`, {
      userId: user1.userId
    });
    console.log('✅ Messages marked as read\n');
    
    // 8. Get unread count
    console.log('8. Getting unread count for user1...');
    const unreadResponse = await axios.get(`${API_BASE}/chat/unread-count?userId=${user1.userId}`);
    console.log(`✅ Unread count: ${unreadResponse.data.unreadCount}\n`);
    
    // 9. Search messages
    console.log('9. Searching messages...');
    const searchResponse = await axios.get(`${API_BASE}/chat/messages/search?q=great&userId=${user1.userId}`);
    console.log(`✅ Found ${searchResponse.data.messages.length} messages containing "great"\n`);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Check if this is run directly
if (require.main === module) {
  runChatTests();
}

module.exports = { runChatTests };
