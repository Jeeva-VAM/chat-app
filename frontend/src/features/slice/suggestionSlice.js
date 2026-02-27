
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

        state.users.push(...action.payload.users);
        state.cursor = action.payload.nextCursor;
    },
  },
});

export const { loadMoreRequest, loadMoreSuccess } =
  suggestionSlice.actions;

export default suggestionSlice.reducer;