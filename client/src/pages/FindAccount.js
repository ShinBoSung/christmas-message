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
      <div className="top-bar">
        <Link to="/" className="site-logo">SecretSanta</Link>
      </div>
      <h2>계정찾기</h2>
      <form onSubmit={mode === 'username' ? handleFindUsername : handleResetPassword} className="find-form">
        {mode === 'username' ? (
          <div className="form-group">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        ) : (
          <>
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
          </>
        )}
        
        <button type="submit">
          {mode === 'username' ? '아이디 찾기' : '비밀번호 재설정'}
        </button>
        
        <div className="mode-selector">
          <a 
            className={mode === 'username' ? 'active' : ''} 
            onClick={() => setMode('username')}
          >
            아이디 찾기
          </a>
          <a 
            className={mode === 'password' ? 'active' : ''} 
            onClick={() => setMode('password')}
          >
            비밀번호 찾기
          </a>
          <Link to="/login" style={{ color: '#666' }}>
            로그인
          </Link>
        </div>
      </form>

      {result && <div className="result-message">{result}</div>}
    </div>
  );
}

export default FindAccount; 