import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null); // Dùng ref để quản lý instance, state để trigger re-render

    // Lắng nghe token từ cả user auth và admin auth
    const userToken = useSelector((state) => state.auth?.token);
    const adminToken = useSelector((state) => state.adminAuth?.token);
    const token = userToken || adminToken;

    // Khi token thay đổi (login/logout) → reconnect socket với token mới
    useEffect(() => {
        // Ngắt kết nối cũ nếu có
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (!token) {
            setSocket(null);
            setIsConnected(false);
            return;
        }

        const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001' || 'http://192.168.88.1:5001';

        // const newSocket = io(SOCKET_URL, {
        //     transports: ['websocket'],
        //     reconnection: true,
        //     auth: {
        //         token: token
        //     }
        // });
        const newSocket = io(SOCKET_URL, {
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnection: true,
            secure: true,      // Vì chúng ta dùng HTTPS bên ngoài
            reconnectionAttempts: 5,
            timeout: 10000,
            auth: {
                token: token
            }
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
            setIsConnected(false);
        });

        socketRef.current = newSocket;
        setSocket(newSocket); // Trigger re-render → các component nhận socket mới ngay

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
