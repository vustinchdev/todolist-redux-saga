import { AddTodolistActionType, RemoveTodolistActionType, SetTodolistsActionType } from './todolists-reducer'
import { GetTasksResponse, ResponseType, TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType } from '../../api/todolists-api'
import { AppRootStateType } from '../../app/store'
import { setAppStatusAC } from '../../app/app-reducer'
import { handleServerAppErrorSaga, handleServerNetworkErrorSaga } from '../../utils/error-utils'
import { CallEffect, PutEffect, call, put, select } from 'redux-saga/effects'
import { AxiosResponse } from 'axios'

const initialState: TasksStateType = {}

export const tasksReducer = (state: TasksStateType = initialState, action: ActionsType): TasksStateType => {
    switch (action.type) {
        case 'REMOVE-TASK':
            return {...state, [action.todolistId]: state[action.todolistId].filter(t => t.id !== action.taskId)}
        case 'ADD-TASK':
            return {...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]]}
        case 'UPDATE-TASK':
            return {
                ...state,
                [action.todolistId]: state[action.todolistId]
                    .map(t => t.id === action.taskId ? {...t, ...action.model} : t)
            }
        case 'ADD-TODOLIST':
            return {...state, [action.todolist.id]: []}
        case 'REMOVE-TODOLIST':
            const copyState = {...state}
            delete copyState[action.id]
            return copyState
        case 'SET-TODOLISTS': {
            const copyState = {...state}
            action.todolists.forEach(tl => {
                copyState[tl.id] = []
            })
            return copyState
        }
        case 'SET-TASKS':
            return {...state, [action.todolistId]: action.tasks}
        default:
            return state
    }
}

// actions
export const removeTaskAC = (taskId: string, todolistId: string) =>
    ({type: 'REMOVE-TASK', taskId, todolistId} as const)
export const addTaskAC = (task: TaskType) =>
    ({type: 'ADD-TASK', task} as const)
export const updateTaskAC = (taskId: string, model: UpdateDomainTaskModelType, todolistId: string) =>
    ({type: 'UPDATE-TASK', model, todolistId, taskId} as const)
export const setTasksAC = (tasks: Array<TaskType>, todolistId: string) =>
    ({type: 'SET-TASKS', tasks, todolistId} as const)


//sagas
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
    const res = yield call(todolistsAPI.deleteTask, action.todolistId, action.taskId) 
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


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
type ActionsType =
    | ReturnType<typeof removeTaskAC>
    | ReturnType<typeof addTaskAC>
    | ReturnType<typeof updateTaskAC>
    | AddTodolistActionType
    | RemoveTodolistActionType
    | SetTodolistsActionType
    | ReturnType<typeof setTasksAC>