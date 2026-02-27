
import { takeEvery, put, select } from "redux-saga/effects";
import { fetchSuggestedUsers } from "../api/fetchSuggestedUsers";
import {
  loadMoreRequest,
  loadMoreSuccess,
} from "../slice/suggestionSlice";

function* loadMoreWorker() {
    console.log("SAGA RUNNING");
  const cursor = yield select(
    (state) => state.suggestions.cursor
  );

  const data = fetchSuggestedUsers(cursor);

  yield put(loadMoreSuccess(data));
}

export function* suggestionSaga() {
  yield takeEvery(loadMoreRequest.type, loadMoreWorker);
}