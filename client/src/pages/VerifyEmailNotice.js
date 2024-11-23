import React from 'react';
import { Link } from 'react-router-dom';
import './VerifyEmailNotice.css';

function VerifyEmailNotice() {
  return (
    <div className="verify-email-notice-container">
      <div className="verify-email-notice-card">
        <h2>이메일 인증 안내</h2>
        <div className="notice-content">
          <p>회원가입이 진행중입니다.</p>
          <p>입력하신 이메일 주소로 인증 메일이 발송되었습니다.</p>
          <p>이메일을 확인하여 인증을 완료해주세요.</p>
          <div className="notice-info">
            <p>⚠️ 인증 메일이 도착하지 않았나요?</p>
            <p>스팸메일함을 확인해주세요.</p>
          </div>
        </div>
        <Link to="/" className="home-link">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}

export default VerifyEmailNotice; 