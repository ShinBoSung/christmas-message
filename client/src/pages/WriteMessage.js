import React, { useState } from 'react';
import './WriteMessage.css';

function WriteMessage() {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 메시지 전송 로직 구현
    console.log('메시지 전송:', { recipient, message });
  };

  return (
    <div className="write-message-container">
      <h2>크리스마스 메시지 작성</h2>
      <form onSubmit={handleSubmit} className="message-form">
        <div className="form-group">
          <label>받는 사람:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="받는 사람의 이름을 입력하세요"
          />
        </div>
        <div className="form-group">
          <label>메시지:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="크리스마스 메시지를 작성하세요"
            rows="5"
          />
        </div>
        <button type="submit">메시지 보내기</button>
      </form>
    </div>
  );
}

export default WriteMessage; 