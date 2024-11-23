const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// MongoDB 연결 문자열 확인용 로그 추가
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const app = express();

// 라우트 파일 불러오기
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');

// 미들웨어 설정
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// 미들웨어로 모든 요청 로깅
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  next();
});

// API 라우트 설정 (먼저 처리되어야 함)
app.use('/api/auth', (req, res, next) => {
  console.log('Auth Route accessed:', req.method, req.url);
  next();
}, authRoutes);
app.use('/api', messageRoutes);
app.use('/', userRoutes);

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, '../client/build')));

// React 앱으로 라우팅 (API 라우트 이후에 처리)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// 기본 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(500).json({ error: err.message || '서버 에러가 발생했습니다.' });
});

// strictQuery 경고 해결
mongoose.set('strictQuery', false);

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB 연결 성공');
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
  });

module.exports = app; 