
import { takeEvery, put, select, call } from "redux-saga/effects";
import { fetchSuggestedUsers } from "../api/fetchSuggestedUsers";
import {
  loadMoreRequest,
  loadMoreSuccess,
} from "../slice/suggestionSlice";

function* loadMoreWorker() {
  console.log("SAGA RUNNING - Fetching users from MongoDB");
  try {
    const cursor = yield select(
      (state) => state.suggestions.cursor
    );

    // Get current user from localStorage
    const currentUserString = localStorage.getItem('user');
    const currentUser = currentUserString ? JSON.parse(currentUserString) : null;
    const currentUserId = currentUser?.sub; // Google OAuth ID

    console.log("Current user ID:", currentUserId);

    const data = yield call(fetchSuggestedUsers, cursor, currentUserId);

    yield put(loadMoreSuccess(data));
  } catch (error) {
    console.error("Failed to load suggested users:", error);
    // You could dispatch a failure action here if needed
    // yield put(loadMoreFailure(error.message));
  }
}

export function* suggestionSaga() {
  yield takeEvery(loadMoreRequest.type, loadMoreWorker);
}