import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      
      toast.success('로그인 성공!');
      navigate(`/pages/${response.data.user.pageId}`);
    } catch (error) {
      console.error('로그인 실패:', error);
      toast.error(error.response?.data?.error || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="top-bar">
        <Link to="/" className="site-logo">SecretSanta</Link>
      </div>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit} className="login-form">
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
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">로그인</button>
        <div className="links">
          <Link to="/find-account">아이디/비밀번호 찾기</Link>
          <Link to="/register">회원가입</Link>
        </div>
      </form>
    </div>
  );
}

export default Login; 