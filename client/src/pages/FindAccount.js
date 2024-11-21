import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './FindAccount.css';

function FindAccount() {
  const [mode, setMode] = useState('username'); // 'username' or 'password'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [result, setResult] = useState('');

  const handleFindUsername = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/find-username', { email });
      toast.success(`아이디는 ${response.data.username} 입니다.`);
    } catch (error) {
      toast.error(error.response?.data?.error || '계정 찾기에 실패했습니다.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/reset-password', { username, email });
      toast.success(`임시 비밀번호: ${response.data.tempPassword}`);
    } catch (error) {
      toast.error(error.response?.data?.error || '비밀번호 재설정에 실패했습니다.');
    }
  };

  return (
    <div className="find-account-container">
      <h2>계정 찾기</h2>
      <div className="mode-selector">
        <button 
          className={mode === 'username' ? 'active' : ''} 
          onClick={() => setMode('username')}
        >
          아이디 찾기
        </button>
        <button 
          className={mode === 'password' ? 'active' : ''} 
          onClick={() => setMode('password')}
        >
          비밀번호 재설정
        </button>
      </div>

      {mode === 'username' ? (
        <form onSubmit={handleFindUsername}>
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">아이디 찾기</button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <input
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">비밀번호 재설정</button>
        </form>
      )}

      {result && <div className="result-message">{result}</div>}

      <div className="links">
        <Link to="/login">로그인으로 돌아가기</Link>
      </div>
    </div>
  );
}

export default FindAccount; 