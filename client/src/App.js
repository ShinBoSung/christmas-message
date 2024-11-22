import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import UserPage from './pages/UserPage';
import FindAccount from './pages/FindAccount';

function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Christmas Message</h1>
        <p>따뜻한 마음을 전하는 크리스마스 메시지 🎄</p>
        <nav className="nav-links">
          <Link to="/login" className="nav-link">로그인</Link>
          <Link to="/register" className="nav-link">회원가입</Link>
        </nav>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users/:username" element={<UserPage />} />
        <Route path="/find-account" element={<FindAccount />} />
      </Routes>
    </Router>
  );
}

export default App; 