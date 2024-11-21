require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const jwt = require('jsonwebtoken');

// 모델 import를 맨 위로 이동
const User = require('./server/models/User');
const Message = require('./server/models/Message');

const app = express();

mongoose.set('strictQuery', false);

// trust proxy 설정 추가
app.set('trust proxy', 1);

// 보안 미들웨어
app.use(helmet()); // 기본 보안 헤더 설정
app.use(mongoSanitize()); // NoSQL 인젝션 방지
app.use(xss()); // XSS 공격 방지

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  standardHeaders: true, // 표준 RateLimit 헤더 반환
  legacyHeaders: false // X-RateLimit 헤더 비활성화
});
app.use('/api/', limiter);

// CORS 설정 강화
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// 미들웨어
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'client/build')));

// MongoDB 연결 상태 확인 함수
const checkMongoDBConnection = () => {
  return mongoose.connection.readyState === 1 ? '연결됨' : '연결안됨';
};

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB 연결 성공');
  console.log('데이터베이스:', mongoose.connection.name);
  console.log('호스트:', mongoose.connection.host);
})
.catch(err => {
  console.error('MongoDB 연결 실패:', err);
});

// API 라우트들
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '서버가 정상적으로 실행중입니다.',
    dbStatus: checkMongoDBConnection(),
    dbDetails: {
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState
    }
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;
    
    console.log('회원가입 요청 데이터:', { 
      username, 
      displayName, 
      email,
      passwordLength: password?.length 
    });
    
    // 입력값 검증
    const validationErrors = [];

    // 아이디 검증
    if (!username) {
      validationErrors.push('아이디를 입력해주세요.');
    } else {
      if (username.length < 4) {
        validationErrors.push('아이디는 최소 4자 이상이어야 합니다.');
      }
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        validationErrors.push('아이디는 영문자와 숫자만 사용할 수 있습니다.');
      }
    }

    // 표시 이름 검증
    if (!displayName) {
      validationErrors.push('표시될 이름을 입력해주세요.');
    } else if (displayName.length < 2) {
      validationErrors.push('표시될 이름은 최소 2자 이상이어야 합니다.');
    }

    // 이메일 검증
    if (!email) {
      validationErrors.push('이메일을 입력해주세요.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push('올바른 이메일 형식이 아닙니다.');
      }
    }

    // 비밀번호 검증
    if (!password) {
      validationErrors.push('비밀번호를 입력해주세요.');
    } else {
      if (password.length < 8) {
        validationErrors.push('비밀번호는 최소 8자 이상이어야 합니다.');
      }
      if (!/[A-Z]/.test(password)) {
        validationErrors.push('비밀번호에 대문자가 포함되어야 합니다.');
      }
      if (!/[a-z]/.test(password)) {
        validationErrors.push('비밀번호에 소문자가 포함되어야 합니다.');
      }
      if (!/[0-9]/.test(password)) {
        validationErrors.push('비밀번호에 숫자가 포함되어야 합니다.');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        validationErrors.push('비밀번호에 특수문자가 포함되어야 합니다.');
      }
    }

    // 유효성 검사 에러가 있으면 반환
    if (validationErrors.length > 0) {
      console.log('유효성 검사 실패:', validationErrors);
      return res.status(400).json({ 
        error: '입력값이 유효하지 않습니다.',
        details: validationErrors 
      });
    }
    
    // 중복 검사
    const existingUser = await User.findOne({ 
      $or: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      console.log('중복된 사용자:', {
        existingUsername: existingUser.username,
        existingEmail: existingUser.email
      });
      
      if (existingUser.username === username) {
        return res.status(400).json({ 
          error: '중복된 아이디입니다.',
          details: ['이미 사용 중인 아이디입니다. 다른 아이디를 선택해주세요.']
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: '중복된 이메일입니다.',
          details: ['이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.']
        });
      }
    }

    // 새 사용자 생성
    const user = new User({
      username,
      displayName,
      email,
      password
    });

    console.log('새 사용자 생성 시도:', {
      username: user.username,
      displayName: user.displayName,
      email: user.email
    });

    await user.save();
    
    console.log('사용자 저장 성공');
    
    res.status(201).json({ 
      message: '회원가입이 완료되었습니다.',
      user: {
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('회원가입 에러 상세:', error);
    console.error('에러 스택:', error.stack);
    
    // Mongoose 유효성 검사 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: '입력값 검증 실패',
        details: messages 
      });
    }
    
    // MongoDB 중복 키 에러 처리
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: '중복된 값이 있습니다.',
        details: [`이미 사용 중인 ${field === 'username' ? '아이디' : '이메일'}입니다.`]
      });
    }

    res.status(500).json({ 
      error: '회원가입 중 오류가 발생했습니다.',
      details: [error.message]
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: '로그인 실패' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(400).json({ error: '사용자 조회 실패' });
  }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { displayName, currentPassword, newPassword } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 확인 필수
    if (!currentPassword) {
      return res.status(400).json({ error: '현재 비밀번호를 입력해주세요.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: '현재 비밀번호가 일치하지 않니다.' });
    }

    // 비밀번호 변경이 요청된 경우
    if (newPassword) {
      user.password = newPassword;
    }

    // 표시 이름 변경
    if (displayName) {
      user.displayName = displayName;
    }

    await user.save();

    // 수정된 사용자 정보 반환
    res.json({
      username: user.username,
      displayName: user.displayName,
      email: user.email
    });
  } catch (error) {
    console.error('사용자 정보 수정 실패:', error);
    res.status(400).json({ error: '사용자 정보 수정 실패' });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // bcrypt를 사용한 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // 사용자의 메시지도 함께 삭제
    await Message.deleteMany({ recipient: username });
    await User.deleteOne({ username });

    res.json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원탈퇴 실패:', error);
    res.status(400).json({ error: '회원탈퇴 실패' });
  }
});

app.post('/api/find-username', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: '해당 이메일로 등록된 계정이 없습니다.' });
    }
    res.json({ username: user.username });
  } catch (error) {
    res.status(400).json({ error: '계정 찾기 실패' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findOne({ username, email });
    if (!user) {
      return res.status(404).json({ error: '일치하는 계정 정보가 없습니다.' });
    }

    // 임시 비밀번호 생성
    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    await user.save();

    // 실제 서비스에서는 이일로 임시 비밀번호를 전송해야 합다
    res.json({ 
      message: '임시 비밀번호가 생성되었습니다',
      tempPassword  // 실제 서비스에서는 이 부분을 제거하고 이메일로만 전송
    });
  } catch (error) {
    res.status(400).json({ error: '비밀번호 재설정 실패' });
  }
});

// 비속어 목록 (한글 포함)
const badWords = [
  '병신', '시발', '씨발', 'ㅅㅂ', 'ㅂㅅ', '개새끼', '새끼', '지랄', '씹', '존나',
  '미친', '꺼져', '죽어', '놈', '년', 'ㅈㄴ', 'ㅁㅊ', '개같은', '씨팔', '시팔',
  'fuck', 'shit', 'bitch', 'bastard', 'damn', 'asshole', 'dick', 'pussy',
  // ... 더 많은 비속어 추가
];

// 비속어 필터링 함수 강화
const containsBadWords = (text) => {
  // 띄어쓰기와 특수문자 제거하고 소문자로 변환
  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[!@#$%^&*(),.?":{}|<>]/g, '');

  // 기본 비속어 체크
  const hasBadWord = badWords.some(word => 
    normalizedText.includes(word.toLowerCase())
  );

  // 자음만 있는 비속어 체크 (예: ㅅㅂ, ㅂㅅ)
  const hasConsonantBadWord = badWords.some(word => {
    const consonantOnly = word.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    return consonantOnly && normalizedText.includes(consonantOnly);
  });

  // 초성 변환 함수
  const getInitialConsonant = (text) => {
    const initialConsonants = {
      'ㄱ': /[가-깋]/g,
      'ㄴ': /[나-닣]/g,
      'ㄷ': /[다-딯]/g,
      'ㄹ': /[라-맇]/g,
      'ㅁ': /[마-밓]/g,
      'ㅂ': /[바-빟]/g,
      'ㅅ': /[사-싷]/g,
      'ㅇ': /[아-잏]/g,
      'ㅈ': /[자-짛]/g,
      'ㅊ': /[차-칳]/g,
      'ㅋ': /[카-킿]/g,
      'ㅌ': /[타-팋]/g,
      'ㅍ': /[파-핗]/g,
      'ㅎ': /[하-힣]/g
    };

    let result = text;
    for (let consonant in initialConsonants) {
      result = result.replace(initialConsonants[consonant], consonant);
    }
    return result;
  };

  // 초성으로 변환된 텍스트에서 비속어 체크
  const initialConsonantText = getInitialConsonant(normalizedText);
  const hasInitialBadWord = badWords.some(word => {
    const initialWord = getInitialConsonant(word);
    return initialConsonantText.includes(initialWord);
  });

  return hasBadWord || hasConsonantBadWord || hasInitialBadWord;
};

app.post('/api/messages', async (req, res) => {
  try {
    const { text, recipientUsername, senderName } = req.body;
    
    console.log('메시지 검사:', text);
    
    // 비속어 체크
    if (containsBadWords(text)) {
      console.log('비속어 감지됨');
      return res.status(400).json({ 
        error: '❌ 비속어가 감지되었습니다. 따뜻한 마음을 담아 다시 작성해주세요.' 
      });
    }
    
    console.log('메시지 저장 요청:', {
      text,
      recipientUsername,
      senderName
    });
    
    // 입력값 검증
    if (!text) {
      console.log('메시지 내용 누락');
      return res.status(400).json({ error: '메시지 내용을 입력해주세요.' });
    }
    if (!recipientUsername) {
      console.log('받는 사람 정보 누락');
      return res.status(400).json({ error: '받는 사람이 지정되지 않았습니다.' });
    }

    // 받는 사람이 존재하는지 확인
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      console.log('받는 사람을 찾을 수 없음:', recipientUsername);
      return res.status(404).json({ error: '받는 사람을 찾을 수 없습니다.' });
    }
    
    // 메시지 생성 및 저장
    const message = new Message({
      text,
      recipient: recipientUsername,
      sender: senderName || '익명',
      createdAt: new Date()
    });
    
    console.log('저장할 메시지 데이터:', message);
    
    await message.save();
    
    console.log('메시지 저장 성공!');
    
    // 성공 응답
    res.status(201).json({
      message: '메시지가 성공적으로 저장되었습니다.',
      data: message
    });
  } catch (error) {
    console.error('메시지 저장 실패. 상세 에러:', error);
    console.error('에러 스택:', error.stack);
    res.status(400).json({ 
      error: '메시지 저장에 실패했습니다.',
      details: error.message 
    });
  }
});

app.get('/api/messages/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { isOwner } = req.query;
    
    // 크리스마스 날짜 체크
    const today = new Date();
    const isChristmas = today.getMonth() === 11 && today.getDate() === 25; // 12월 25일

    const messages = await Message.find({ recipient: username })
      .sort({ createdAt: -1 });
    
    if (isOwner === 'true') {
      if (!isChristmas) {
        // 크리스마스가 아닌 경우 메시지 개수만 반환
        res.json({ 
          count: messages.length,
          isChristmas: false,
          message: "메시지는 크리스마스 당일에 확인할 수 있습니다."
        });
      } else {
        // 크리스마스인 경우 모든 메시지 반환
        res.json({
          messages,
          isChristmas: true
        });
      }
    } else {
      // 방문자에게는 메시지 개수만 제공
      res.json({ count: messages.length });
    }
  } catch (error) {
    res.status(400).json({ error: '메시지 조회 실패' });
  }
});

// React 앱 제공은 API 라우트 뒤에 위치해야 합니다
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행중입니다.`);
});

// MongoDB 연결 이벤트 리스너
mongoose.connection.on('connected', () => {
  console.log('Mongoose가 MongoDB에 연결되었습니다.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 연결 에러:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 연결이 끊어졌습니다.');
});