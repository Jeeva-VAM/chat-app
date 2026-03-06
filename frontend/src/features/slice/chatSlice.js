import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatApi from '../../services/ChatApiService';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await chatApi.getUserConversations(userId);
      return response.conversations;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createDirectConversation = createAsyncThunk(
  'chat/createDirectConversation',
  async ({ user1Id, user2Id }, { rejectWithValue }) => {
    try {
      const response = await chatApi.createDirectConversation(user1Id, user2Id);
      return response.conversation;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await chatApi.getConversationMessages(conversationId, page, limit);
      return { conversationId, ...response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, messageData }, { rejectWithValue }) => {
    try {
      const response = await chatApi.sendMessage(conversationId, messageData);
      return { conversationId, message: response.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  conversations: [],
  messages: {}, // { conversationId: { messages: [], pagination: {} } }
  activeConversation: null,
  unreadCount: 0,
  loading: {
    conversations: false,
    messages: false,
    sending: false
  },
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = { messages: [], pagination: {} };
      }
      state.messages[conversationId].messages.push(message);
    },
    updateMessage: (state, action) => {
      const { conversationId, messageId, updates } = action.payload;
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].messages.findIndex(
          msg => msg._id === messageId
        );
        if (messageIndex !== -1) {
          Object.assign(state.messages[conversationId].messages[messageIndex], updates);
        }
      }
    },
    removeMessage: (state, action) => {
      const { conversationId, messageId } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId].messages = state.messages[conversationId].messages.filter(
          msg => msg._id !== messageId
        );
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading.conversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading.conversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading.conversations = false;
        state.error = action.payload;
      })
      
      // Create conversation
      .addCase(createDirectConversation.fulfilled, (state, action) => {
        const conversation = action.payload;
        const existingIndex = state.conversations.findIndex(c => c.id === conversation._id);
        if (existingIndex === -1) {
          state.conversations.unshift(conversation);
        }
        state.activeConversation = conversation;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading.messages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading.messages = false;
        const { conversationId, messages, pagination } = action.payload;
        state.messages[conversationId] = { messages, pagination };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = { messages: [], pagination: {} };
        }
        state.messages[conversationId].messages.push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setActiveConversation, 
  addMessage, 
  updateMessage, 
  removeMessage, 
  clearError 
} = chatSlice.actions;

export default chatSlice.reducer;
