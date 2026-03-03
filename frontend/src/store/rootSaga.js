import { all } from "redux-saga/effects";
import messageSaga from "./sagas/messageSaga";
import { suggestionSaga } from "../features/saga/suggestionSaga";

export default function* rootSaga() {
  yield all([
    messageSaga(),
    suggestionSaga()
  ]);
}