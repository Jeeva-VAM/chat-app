import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';

function* sendMessageSaga(action) {
  try {
    const { chatId, text } = action.payload;

    const response = yield call(
      axios.post,
      `http://localhost:5000/messages`,
      { chatId, text }
    );

    yield put({
      type: "SEND_MESSAGE_SUCCESS",
      payload: {
        chatId,
        message: response.data
      }
    });
  } catch (error) {
    yield put({ type: "SEND_MESSAGE_FAILURE", error });
  }
}

function* fetchMessagesSaga(action) {
  try {
    const chatId = action.payload;

    const response = yield call(
      axios.get,
      `http://localhost:5000/messages/${chatId}`
    );

    yield put({
      type: "FETCH_MESSAGES_SUCCESS",
      payload: response.data,
      chatId
    });
  } catch (error) {
    console.log(error);
  }
}

export default function* messageSaga() {
  yield takeLatest("SEND_MESSAGE_REQUEST", sendMessageSaga);
  yield takeLatest("FETCH_MESSAGES_REQUEST", fetchMessagesSaga);
}