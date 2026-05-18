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
import QuickContact from './components/QuickContact/QuickContact';
import { useTrackVisitMutation } from './features/statistics/statisticsApi';

function AppInner() {
    const calledRef = useRef(false);
    const trackingCalledRef = useRef(false);
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    const [trackVisit] = useTrackVisitMutation();

    useEffect(() => {
        if (isAuthenticated && !calledRef.current) {
            dispatch(fetchCartThunk());
            calledRef.current = true;
        }
    }, [isAuthenticated, dispatch]);

    useEffect(() => {
        const hasTracked = sessionStorage.getItem('tracked_visit');
        if (!hasTracked && !isAdminPage && !trackingCalledRef.current) {
            trackingCalledRef.current = true; // Chặn ngay lập tức
            trackVisit().unwrap()
                .then(() => sessionStorage.setItem('tracked_visit', 'true'))
                .catch(err => {
                    console.error("Failed to track visit:", err);
                    trackingCalledRef.current = false; // Reset nếu lỗi để có thể thử lại
                });
        }
    }, [trackVisit, isAdminPage]);

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
            {!isAdminPage && <QuickContact />}
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