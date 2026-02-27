import { all } from "redux-saga/effects";
import messageSaga from "./sagas/messageSaga";

export default function* rootSaga() {
  yield all([
    messageSaga()
  ]);
}