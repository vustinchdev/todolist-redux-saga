import {MeResponse, authAPI} from '../api/todolists-api'
import {setIsLoggedInAC} from '../features/Login/auth-reducer'
import {CallEffect, PutEffect, call, put, takeEvery} from 'redux-saga/effects'
import { setAppInitializedAC } from './app-reducer';

export function* initializeAppWorkerSaga(): Generator<CallEffect | PutEffect, void, any>  {
    const data: MeResponse = yield call(authAPI.me)
        if (data.resultCode === 0) {
            yield put(setIsLoggedInAC(true));
        } else {

        }
        yield put(setAppInitializedAC(true));
}

export const initializeApp = () => ({type: 'APP/INITIALIZE-APP'})

export function* appWatcherSaga() {
    yield takeEvery('APP/INITIALIZE-APP', initializeAppWorkerSaga)
}