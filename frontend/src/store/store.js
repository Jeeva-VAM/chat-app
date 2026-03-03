import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import messageReducer from "./reducers/messageReducer";
import rootSaga from "./rootSaga";
import suggestionReducer from "../features/slice/suggestionSlice";


const sagaMiddleware = createSagaMiddleware();


const store = configureStore({
  reducer: {
    message: messageReducer,
    suggestions: suggestionReducer,  
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});


sagaMiddleware.run(rootSaga);

export default store;