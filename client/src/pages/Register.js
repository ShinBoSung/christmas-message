import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Register.css';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', {
        username,
        displayName,
        email,
        password
      });
      
      toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
      navigate('/verify-email-notice');
    } catch (error) {
      console.error('회원가입 실패:', error);
      
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