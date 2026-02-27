const initialState = {
    messagesByChat: {},
    loading: false,
    error: null
  };
  
  export default function messageReducer(state = initialState, action) {
    switch (action.type) {
      case "SEND_MESSAGE_REQUEST":
      case "FETCH_MESSAGES_REQUEST":
        return { ...state, loading: true };
  
      case "FETCH_MESSAGES_SUCCESS":
        return {
          ...state,
          loading: false,
          messagesByChat: {
            ...state.messagesByChat,
            [action.chatId]: action.payload
          }
        };
  
        case "SEND_MESSAGE_SUCCESS": {
            const { chatId, message } = action.payload;
          
            return {
              ...state,
              loading: false,
              messagesByChat: {
                ...state.messagesByChat,
                [chatId]: [
                  ...(state.messagesByChat[chatId] || []),
                  message
                ]
              }
            };
          }
  
      default:
        return state;
    }
  }