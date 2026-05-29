import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import AuthProvider from './context/AuthProvider';
import SocketProvider from './context/SocketProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from "react-router-dom";
import ThemeProvider from './context/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
        <App />
        <ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={true}
  closeOnClick
  pauseOnHover
  draggable
  theme="dark"
  toastStyle={{
    background: '#111827',
    color: '#f3f4f6',
    border: '1px solid #374151',
    borderRadius: '12px',
    fontSize: '14px',
  }}
/>     </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
)