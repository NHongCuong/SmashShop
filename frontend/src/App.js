import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import pages from './routes';
import './App.css';
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './app/store/store';
import { fetchCartThunk} from './app/store/cartThunks';
import { selectIsAuthenticated } from './app/store/authSlice';
import BackToTop from './components/BackToTop/BackToTop';
import UserLiveChat from './components/LiveChat/UserLiveChat';

function AppInner() {
    const calledRef = useRef(false);
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (isAuthenticated && !calledRef.current) {
            dispatch(fetchCartThunk());
            calledRef.current = true;
        }
    }, [isAuthenticated, dispatch]);

    return (
        <div className="App font-body">
            <Routes>
            {pages.map(({ path, Component, children }, index) => (
                <Route
                key={index}
                path={path}
                element={<Component isAuthenticated={isAuthenticated}/>}
                >
                {children && children.map(({ path: childPath, Component: ChildComponent }, childIndex) => (
                    <Route key={childIndex} path={childPath} element={<ChildComponent />} />
                ))}
                </Route>
            ))}
            </Routes>
            <BackToTop />
            {/* Chỉ hiện UserLiveChat ở page user (không phải admin) khi đã đăng nhập */}
            {isAuthenticated && !isAdminPage && <UserLiveChat />}
        </div>
    );
}

function App() {
    return (
        <Provider store={store}>
            <Router>
                <AppInner />
            </Router>
        </Provider>
    );
}

export default App;