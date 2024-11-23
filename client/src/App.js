import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import UserPage from './pages/UserPage';
import FindAccount from './pages/FindAccount';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailNotice from './pages/VerifyEmailNotice';

function Home() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Christmas Message</h1>
        <p>따뜻한 마음을 전하는 크리스마스 메시지 🎄</p>
        {user ? (
          <div className="user-actions">
            <button 
              onClick={() => navigate(`/pages/${user.pageId}`)} 
              className="nav-link"
            >
              메시지 확인하기
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pages/${user.pageId}`);
                toast.success('페이지 주소가 복사되었습니다!');
              }} 
              className="nav-link"
            >
              내 페이지 공유하기
            </button>
            <button onClick={handleLogout} className="nav-link logout">
              로그아웃
            </button>
          </div>
        ) : (
          <nav className="nav-links">
            <Link to="/login" className="nav-link">로그인</Link>
            <Link to="/register" className="nav-link">회원가입</Link>
          </nav>
        )}
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
        <Route path="/pages/:pageId" element={<UserPage />} />
        <Route path="/find-account" element={<FindAccount />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
      </Routes>
    </Router>
  );
}

export default App; 