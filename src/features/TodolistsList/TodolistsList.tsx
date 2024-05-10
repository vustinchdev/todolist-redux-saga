import React, {useCallback, useEffect} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {AppRootStateType} from '../../app/store'
import {
    changeTodolistFilterAC,
    FilterValuesType,
    TodolistDomainType
} from './todolists-reducer'
import {TasksStateType} from './tasks-reducer'
import {TaskStatuses} from '../../api/todolists-api'
import {Grid, Paper} from '@material-ui/core'
import {AddItemForm} from '../../components/AddItemForm/AddItemForm'
import {Todolist} from './Todolist/Todolist'
import { Redirect } from 'react-router-dom'
import { addTask, removeTask, updateTask } from './tasks-sagas'
import { addTodolist, changeTodolistTitle, fetchTodolists, removeTodolist } from './todolists-sagas'

type PropsType = {
    demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector<AppRootStateType, Array<TodolistDomainType>>(state => state.todolists)
    const tasks = useSelector<AppRootStateType, TasksStateType>(state => state.tasks)
    const isLoggedIn = useSelector<AppRootStateType, boolean>(state => state.auth.isLoggedIn)

    const dispatch = useDispatch()

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        dispatch(fetchTodolists())
    }, [demo, dispatch, isLoggedIn])

    const removeTaskCallback = useCallback(function (id: string, todolistId: string) {
        dispatch(removeTask(id, todolistId))
    }, [dispatch])

    const addTaskCallback = useCallback(function (title: string, todolistId: string) {
        const thunk = addTask(title, todolistId)
        dispatch(thunk)
    }, [dispatch])

    const changeStatus = useCallback(function (id: string, status: TaskStatuses, todolistId: string) {
        const thunk = updateTask(id, {status}, todolistId)
        dispatch(thunk)
    }, [dispatch])

    const changeTaskTitle = useCallback(function (id: string, newTitle: string, todolistId: string) {
        const thunk = updateTask(id, {title: newTitle}, todolistId)
        dispatch(thunk)
    }, [dispatch])

    const changeFilter = useCallback(function (value: FilterValuesType, todolistId: string) {
        const action = changeTodolistFilterAC(todolistId, value)
        dispatch(action)
    }, [dispatch])

    const removeTodolistCallback = useCallback(function (id: string) {
        const thunk = removeTodolist(id)
        dispatch(thunk)
    }, [dispatch])

    const changeTodolistTitleCallback = useCallback(function (id: string, title: string) {
        const thunk = changeTodolistTitle(id, title)
        dispatch(thunk)
    }, [dispatch])

    const addTodolistCallback = useCallback((title: string) => {
        dispatch(addTodolist(title))
    }, [dispatch])

    if (!isLoggedIn) {
        return <Redirect to={"/login"} />
    }

    return <>
        <Grid container style={{padding: '20px'}}>
            <AddItemForm addItem={addTodolistCallback}/>
        </Grid>
        <Grid container spacing={3}>
            {
                todolists.map(tl => {
                    let allTodolistTasks = tasks[tl.id]

                    return <Grid item key={tl.id}>
                        <Paper style={{padding: '10px'}}>
                            <Todolist
                                todolist={tl}
                                tasks={allTodolistTasks}
                                removeTask={removeTaskCallback}
                                changeFilter={changeFilter}
                                addTask={addTaskCallback}
                                changeTaskStatus={changeStatus}
                                removeTodolist={removeTodolistCallback}
                                changeTaskTitle={changeTaskTitle}
                                changeTodolistTitle={changeTodolistTitleCallback}
                                demo={demo}
                            />
                        </Paper>
                    </Grid>
                })
            }
        </Grid>
    </>
}
