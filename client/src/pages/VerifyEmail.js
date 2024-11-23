import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './VerifyEmail.css';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        setVerificationStatus('success');
        toast.success(response.data.message);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setVerificationStatus('error');
        if (error.response?.data?.requireReregistration) {
          toast.error('인증 기간이 만료되었습니다. 다시 회원가입을 진행해주세요.');
        } else {
          toast.error(error.response?.data?.error || '인증에 실패했습니다.');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2>이메일 인증</h2>
        {verificationStatus === 'verifying' && (
          <div className="status-message">
            <p>이메일 인증을 진행 중입니다...</p>
          </div>
        )}
        {verificationStatus === 'success' && (
          <div className="status-message success">
            <p>이메일 인증이 완료되었습니다!</p>
            <p>잠시 후 로그인 페이지로 이동합니다...</p>
            <Link to="/login" className="login-link">지금 로그인하기</Link>
          </div>
        )}
        {verificationStatus === 'error' && (
          <div className="status-message error">
            <p>인증에 실패했습니다.</p>
            <p>다시 회원가입을 진행해주세요.</p>
            <Link to="/register" className="register-link">회원가입으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail; 