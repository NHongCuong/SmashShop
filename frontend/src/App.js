import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import pages from './routes';
import './App.css';
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './app/store/store';
import { fetchCartThunk} from './app/store/cartThunks';
import { selectIsAuthenticated } from './app/store/authSlice';
function App() {
    const calledRef = useRef(false);
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    // setIsAuthenticated ("true");
    // console.log(isAuthenticated)
    useEffect(() => {
        if (isAuthenticated && !calledRef.current) {
            dispatch(fetchCartThunk());
            calledRef.current = true; // <== Thêm dòng này

        }
    }, [isAuthenticated, dispatch]); 
    
    return (
        <Provider store={store}>
            <div className="App font-body">
                <Router>
                <Routes>
                {pages.map(({ path, Component, children }, index) => (
                    <Route 
                    key={index} 
                    path={path} 
                    element={<Component isAuthenticated={isAuthenticated}/>}
                    >
                    {/* children  */}
                    {children && children.map(({ path: childPath, Component: ChildComponent }, childIndex) => (
                        <Route key={childIndex} path={childPath} element={<ChildComponent />} />
                    ))}
                    </Route>
                ))}
                </Routes>
                </Router>
            </div>
        </Provider>
    );
}

export default App;