import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import messageReducer from "./reducers/messageReducer";
import rootSaga from "./rootSaga";

// 1️⃣ Create Saga Middleware
const sagaMiddleware = createSagaMiddleware();

// 2️⃣ Create Store
const store = configureStore({
  reducer: {
    message: messageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

// 3️⃣ Run Saga
sagaMiddleware.run(rootSaga);

export default store;