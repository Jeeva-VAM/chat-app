
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import suggestionReducer from "../features/slice/suggestionSlice";
import rootSaga from "./rootSaga";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    suggestions: suggestionReducer,
  },
  middleware: (gDM) =>
    gDM({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);