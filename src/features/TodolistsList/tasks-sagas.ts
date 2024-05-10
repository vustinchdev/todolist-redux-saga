import { AppRootStateType } from '../../app/store'
import { setAppStatusAC } from '../../app/app-reducer'
import { handleServerAppErrorSaga, handleServerNetworkErrorSaga } from '../../utils/error-utils'
import { CallEffect, PutEffect, call, put, select, takeEvery } from 'redux-saga/effects'
import { GetTasksResponse, ResponseType, TaskType, todolistsAPI, UpdateTaskModelType } from '../../api/todolists-api'
import { AxiosResponse } from 'axios'
import { UpdateDomainTaskModelType, addTaskAC, removeTaskAC, setTasksAC, updateTaskAC } from './tasks-reducer'

export function* fetchTasksWorkerSaga (action: ReturnType<typeof fetchTasks>): 
Generator<CallEffect | PutEffect, void, AxiosResponse<GetTasksResponse>> {
        yield put(setAppStatusAC('loading'))
        const res = yield call(todolistsAPI.getTasks, action.todolistId)
        const tasks = res.data.items
        yield put(setTasksAC(tasks, action.todolistId))
        yield put(setAppStatusAC('succeeded'))
    }

export const fetchTasks = (todolistId: string) => ({type: 'TASKS/FETCH-TASKS', todolistId})

export function* removeTaskWorkerSaga (action: ReturnType<typeof removeTask>):
Generator<CallEffect | PutEffect, void, AxiosResponse<ResponseType>>{
    yield call(todolistsAPI.deleteTask, action.todolistId, action.taskId) 
    yield put(removeTaskAC(action.taskId, action.todolistId))
}

export const removeTask = (todolistId: string, taskId: string) => ({type: 'TASKS/REMOVE-TASK', todolistId, taskId})

export function* addTaskWorkerSaga (action: ReturnType<typeof addTask>){
    yield put(setAppStatusAC('loading'))
    try {
        const res: AxiosResponse<ResponseType<{ item: TaskType}>> = yield call(todolistsAPI.createTask, action.todolistId, action.title)
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                const action = addTaskAC(task)
                yield put(action)
                yield put(setAppStatusAC('succeeded'))
            } else {
                return handleServerAppErrorSaga(res.data);
            }
    } catch (error) {
            return handleServerNetworkErrorSaga(error as {message: string})

    }
}

export const addTask = (title: string, todolistId: string) => ({type: 'TASKS/ADD-TASK', title, todolistId})

export function* updateTaskWorkerSaga(action: ReturnType<typeof updateTask>) {
    const { taskId, domainModel, todolistId } = action
        const state: AppRootStateType = yield select()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel
        }

        const res: AxiosResponse<ResponseType<TaskType>> = yield call(todolistsAPI.updateTask, todolistId, taskId, apiModel)
            try{
                if (res.data.resultCode === 0) {
                    const action = updateTaskAC(taskId, domainModel, todolistId)
                    yield put(action)
                } else {
                    handleServerAppErrorSaga(res.data);
                }
            } catch(error) {
                handleServerNetworkErrorSaga(error as {message: string});
    }
}

    export const updateTask = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) => 
        ({type: 'TASKS/UPDATE-TASK', taskId, domainModel, todolistId})


    export function* tasksWatcherSaga() {
        yield takeEvery('TASKS/FETCH-TASKS', fetchTasksWorkerSaga)
        yield takeEvery('TASKS/REMOVE-TASK', removeTaskWorkerSaga)
        yield takeEvery('TASKS/ADD-TASK', addTaskWorkerSaga)
        yield takeEvery('TASKS/UPDATE-TASK', updateTaskWorkerSaga)
    }