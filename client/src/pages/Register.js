import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Register.css';
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
}, error => {
  console.log('Response Error:', error.config, error.response);
  return Promise.reject(error);
});

function Register() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('회원가입 폼 제출:', { username, displayName, email });

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      console.log('서버에 회원가입 요청 시작');
      console.log('요청 URL:', '/api/auth/register');
      console.log('요청 데이터:', { username, displayName, email, password });
      
      const response = await axios.post('/api/auth/register', {
        username,
        displayName,
        email,
        password
      });
      
      console.log('서버 응답:', response.data);
      toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
      navigate('/verify-email-notice');
    } catch (error) {
      console.error('회원가입 요청 실패:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      console.error('에러 응답:', error.response?.data);
      
      if (error.response?.data?.details) {
        error.response.data.details.forEach(detail => {
          toast.error(detail);
        });
      } else {
        toast.error(error.response?.data?.error || '회원가입에 실패했습니다.');
      }
    }
  };

  return (
    <div className="register-container">
      <div className="top-bar">
        <Link to="/" className="site-logo">SecretSanta</Link>
      </div>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="아이디 (로그인용)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="표시될 이름"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
        <div className="form-group">
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">회원가입</button>
        <p className="login-link">
          이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
        </p>
      </form>
    </div>
  );
}

export default Register; 