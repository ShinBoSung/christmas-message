import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './UserPage.css';
import axios from 'axios';
import { toast } from 'react-toastify';

function UserPage() {
  const { username } = useParams();
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isOwner = user && user.username === username;
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/users/${username}`);
        console.log('서버에서 받은 사용자 정보:', response.data);
        
        if (response.data.displayName) {
          setOwnerDisplayName(response.data.displayName);
          
          if (isOwner) {
            const userData = JSON.parse(localStorage.getItem('user'));
            const updatedUserData = {
              ...userData,
              displayName: response.data.displayName
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
          }
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    };

    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.displayName) {
      setOwnerDisplayName(userData.displayName);
    }

    fetchUserData();
  }, [username, isOwner]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/messages/${username}?isOwner=${isOwner}`);
        if (isOwner) {
          if (response.data.isChristmas) {
            setMessages(response.data.messages);
          } else {
            const newCount = response.data.count;
            const savedCount = parseInt(localStorage.getItem(`${username}_messageCount`) || '0');
            
            if (savedCount === 0) {
              toast.info(`현재 ${newCount}개의 메시지가 있습니다! 🎄`);
            } else if (newCount > savedCount) {
              const newMessages = newCount - savedCount;
              toast.info(`${newMessages}개의 새로운 메시지가 도착했습니다! 🎄`);
            }
            
            setMessageCount(newCount);
            localStorage.setItem(`${username}_messageCount`, newCount.toString());
          }
        } else {
          setMessageCount(response.data.count);
        }
      } catch (error) {
        console.error('메시지 조회 실패:', error);
      }
    };
    
    fetchMessages();

    const interval = setInterval(fetchMessages, 60000);

    return () => clearInterval(interval);
  }, [username, isOwner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/messages', {
        text: message,
        recipientUsername: username,
        senderName: isAnonymous ? '익명' : senderName
      });
      
      // 메시지 전송 후 폼 초기화
      setMessage('');
      setSenderName('');
      setIsAnonymous(false);
      
      // 메시지 카운트 업데이트
      const response = await axios.get(`/api/messages/${username}?isOwner=false`);
      setMessageCount(response.data.count);
      
      toast.success('메시지가 전송되었습니다!');
    } catch (error) {
      console.error('메시지 저장 실패:', error);
      // 서버에서 보낸 에러 메시지 표시
      toast.error(error.response?.data?.error || '메시지 저장에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`${username}_messageCount`);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const copyPageUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('페이지 주소가 복사되었습니다!');
  };

  // 프로필 수정 모달 열기
  const openEditModal = () => {
    setEditDisplayName(ownerDisplayName);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsEditModalOpen(true);
  };

  // 프로필 수정 처리
  const handleEditProfile = async (e) => {
    e.preventDefault();
    
    // 현재 비밀번호 필수 체크
    if (!currentPassword) {
      toast.error('현재 비밀번호를 입력해주세요.');
      return;
    }

    // 새 비밀번호 확인
    if (newPassword && newPassword !== confirmNewPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await axios.put(`/api/users/${username}`, {
        displayName: editDisplayName,
        currentPassword,
        newPassword: newPassword || undefined
      });

      // 상태 업데이트
      setOwnerDisplayName(response.data.displayName);
      
      // localStorage 업데이트
      const userData = JSON.parse(localStorage.getItem('user'));
      const updatedUserData = {
        ...userData,
        displayName: response.data.displayName
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // 입력 필드 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      setIsEditModalOpen(false);
      toast.success('프로필이 수정되었습니다.');
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      toast.error(error.response?.data?.error || '프로필 수정에 실패했습니다.');
    }
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!deletePassword) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }

    // 사용자 정의 confirm 대신 toast 사용
    toast.warn(
      '정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        buttons: [
          {
            label: '예',
            onClick: async () => {
              try {
                await axios.delete(`/api/users/${username}`, {
                  data: { password: deletePassword }
                });
                
                localStorage.removeItem('user');
                toast.success('회원탈퇴가 완료되었습니다.');
                navigate('/');
              } catch (error) {
                console.error('회원탈퇴 실패:', error);
                toast.error(error.response?.data?.error || '회원탈퇴에 실패했습니다.');
              }
            }
          },
          {
            label: '아니오',
            onClick: () => toast.dismiss()
          }
        ]
      }
    );
  };

  const generatePageId = () => {
    return 'page_' + Math.random().toString(36).substr(2, 9);
  }

  // 회원가입 시 페이지 ID 생성
  const createUser = async (userData) => {
    const pageId = generatePageId();
    const user = {
      ...userData,
      pageId: pageId  // 랜덤 생성된 페이지 ID 저장
    };
    // DB에 저장
  }

  return (
    <div className="user-page">
      {isOwner ? (
        // 소유자인 경우 메시지함 보기 화면
        <>
          <div className="top-bar">
            <a href="/" className="site-logo">SecretSanta</a>
            <nav className="nav-menu">
              <a href="#" onClick={openEditModal}>프로필 수정</a>
              <a href="#" onClick={copyPageUrl}>페이지 공유하기</a>
              <a href="#" onClick={handleLogout}>로그아웃</a>
              <a href="#" onClick={() => setIsDeleteModalOpen(true)}>회원탈퇴</a>
            </nav>
          </div>

          <header className="user-header">
            <h2>{ownerDisplayName || '사용자'}님의 크리스마스 메시지함</h2>
          </header>

          <div className="message-section">
            <div className="message-count-info">
              <p>🎄 메시지는 크리스마스 당일에 확인할 수 있습니다 🎄</p>
              <p>현재 {messageCount}개의 메시지가 도착했습니다!</p>
            </div>
          </div>

          {/* 회원탈퇴 모달 */}
          {isDeleteModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>회원탈퇴</h3>
                <p className="delete-warning">
                  정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  모든 메시지와 계정 정보가 영구적으로 삭제됩니다.
                </p>
                <form onSubmit={handleDeleteAccount} className="delete-form">
                  <div className="form-group">
                    <label>비밀번호 확인</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="delete-confirm-btn">탈퇴하기</button>
                    <button 
                      type="button" 
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="cancel-btn"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        // 방문자인 경우 메시지 작성 화면
        <>
          <div className="top-bar">
            <Link to="/" className="site-logo">SecretSanta</Link>
            {user ? (
              <nav className="nav-menu">
                <Link to={`/users/${user.username}`}>내 메시지함</Link>
                <a href="#" onClick={handleLogout}>로그아웃</a>
              </nav>
            ) : (
              <nav className="nav-menu">
                <Link to="/login">로그인</Link>
                <Link to="/register">회원가입</Link>
              </nav>
            )}
          </div>

          <header className="user-header">
            <h2>{ownerDisplayName || '사용자'}님에게 메시지 보내기</h2>
          </header>

          <div className="message-section">
            <form onSubmit={handleSubmit} className="message-form">
              <div className="sender-section">
                <div className="sender-type">
                  <label>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    익명으로 보내기
                  </label>
                </div>
                {!isAnonymous && (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="보내는 사람 이름"
                    required={!isAnonymous}
                    className="sender-input"
                  />
                )}
              </div>
              <div className="message-input-container">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="따뜻한 크리스마스 메시지를 작성해보세요..."
                  required
                />
                <div className="message-guidelines">
                  <p className="warning">⚠️ 비속어가 포함된 메시지는 전송되지 않습니다.</p>
                  <div className="message-examples">
                    <p>💌 메시지 작성 예시:</p>
                    <ul>
                      <li>"메리 크리스마스! 올해도 행복한 하루 보내세요."</li>
                      <li>"따뜻한 연말 보내시고 새해 복 많이 받으세요!"</li>
                      <li>"항상 건강하고 행복하시길 바랍니다."</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button type="submit">메시지 보내기</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default UserPage; 