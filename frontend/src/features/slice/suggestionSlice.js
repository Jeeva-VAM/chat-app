
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  cursor: 0,
};

const suggestionSlice = createSlice({
  name: "suggestions",
  initialState,
  reducers: {
    loadMoreRequest: () => {},

    loadMoreSuccess: (state, action) => {
        console.log("STORE UPDATED", action.payload);

        const newUsers = action.payload.users || [];
        
        // Create a Set of existing user IDs for quick lookup
        const existingUserIds = new Set(state.users.map(user => user.id));
        
        // Filter out duplicates from new users
        const uniqueNewUsers = newUsers.filter(user => !existingUserIds.has(user.id));
        
        // Add only unique users
        state.users.push(...uniqueNewUsers);
        state.cursor = action.payload.nextCursor;
        
        console.log(`Added ${uniqueNewUsers.length} unique users. Total users: ${state.users.length}`);
    },

    resetSuggestions: (state) => {
        state.users = [];
        state.cursor = 0;
        console.log("Suggestions reset");
    },
  },
});

export const { loadMoreRequest, loadMoreSuccess, resetSuggestions } =
  suggestionSlice.actions;

export default suggestionSlice.reducer;