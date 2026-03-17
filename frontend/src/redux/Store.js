import {createStore} from 'react-redux';
import { counterReducer } from './Reducer';
export const store = createStore(counterReducer)