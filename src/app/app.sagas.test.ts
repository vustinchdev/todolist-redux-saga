import { call, put } from "redux-saga/effects"
import { initializeAppWorkerSaga } from "./app-sagas"
import { MeResponse, authAPI } from "../api/todolists-api"
import { setIsLoggedInAC } from "../features/Login/auth-reducer"
import { setAppInitializedAC } from "./app-reducer"

let meResponse: MeResponse

beforeEach(() => {
    meResponse = {
        resultCode: 0, 
        data:{
            email:'', 
            id: 3, 
            login:''
        }, 
        messages: []}
})

test('initializeAppWorkerSaga login success', () => {
    const gen = initializeAppWorkerSaga()
    let result = gen.next()
    expect(result.value).toEqual(call(authAPI.me)) 

    result = gen.next(meResponse) 
    expect(result.value).toEqual(put(setIsLoggedInAC(true)))

    result = gen.next(meResponse)
    expect(result.value).toEqual(put(setAppInitializedAC(true)))
})

test('initializeAppWorkerSaga login unsuccess', () => {
    const gen = initializeAppWorkerSaga()
    let result = gen.next()
    expect(result.value).toEqual(call(authAPI.me)) 

    meResponse.resultCode = 1

    result = gen.next(meResponse)
    expect(result.value).toEqual(put(setAppInitializedAC(true)))
})