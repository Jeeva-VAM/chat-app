// app/rootSaga.js
import { all } from "redux-saga/effects";
import { suggestionSaga } from "../features/saga/suggestionSaga";

export default function* rootSaga() {
  yield all([
    suggestionSaga(),
  ]);
}