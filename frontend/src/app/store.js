
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import suggestionReducer from "../features/slice/suggestionSlice";
import chatReducer from "../features/slice/chatSlice";
import rootSaga from "./rootSaga";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    suggestions: suggestionReducer,
    chat: chatReducer,
  },
  middleware: (gDM) =>
    gDM({ thunk: true }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);