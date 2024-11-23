const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../config/emailConfig');

// 라우트 테스트용 엔드포인트
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

router.post('/register', async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;
    
    console.log('회원가입 시도:', { username, displayName, email });

    // 이미 인증된 사용자 체크
    const existingVerifiedUser = await User.findOne({
      $or: [
        { username, isEmailVerified: true },
        { email, isEmailVerified: true }
      ]
    });

    if (existingVerifiedUser) {
      const field = existingVerifiedUser.username === username ? '아이디' : '이메일';
      return res.status(400).json({ error: `이미 사용 중인 ${field}입니다.` });
    }

    // 미인증 사용자 삭제
    await User.deleteMany({
      $or: [
        { username, isEmailVerified: false },
        { email, isEmailVerified: false }
      ]
    });

    // 인증된 사용자 중복 체크
    const existingUser = await User.findOne({ 
      $or: [
        { username: username, isEmailVerified: true },
        { email: email, isEmailVerified: true }
      ]
    });

    if (existingUser) {
      const field = existingUser.username === username ? '아이디' : '이메일';
      return res.status(400).json({ 
        error: `이미 사용 중인 ${field}입니다.` 
      });
    }

    // 이메일 인증 토큰 생성
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('생성된 인증 토큰:', verificationToken);
    
    const user = new User({
      username,
      displayName,
      email,
      password,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      isEmailVerified: false
    });

    await user.save();
    console.log('사용자 DB 저장 성공');

    try {
      await sendVerificationEmail(email, verificationToken);
      console.log('인증 이메일 발송 성공');
    } catch (emailError) {
      console.error('이메일 발송 실패:', emailError);
      await User.deleteOne({ _id: user._id });
      throw new Error('이메일 발송에 실패했습니다. 다시 시도해주세요.');
    }

    res.status(201).json({ 
      message: '회원가입이 진행중입니다. 이메일을 확인해주세요.' 
    });
  } catch (error) {
    console.error('회원가입 처리 중 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 이메일 인증 라우트
router.get('/verify-email/:token', async (req, res) => {
  try {
    console.log('인증 시도:', req.params.token);  // 디버깅 로그 추가

    // 토큰으로 사용자 찾기
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    console.log('찾은 사용자:', user);  // 디버깅 로그 추가
    console.log('현재 시간:', Date.now());  // 디버깅 로그 추가
    if (user) {
      console.log('토큰 만료 시간:', user.verificationTokenExpires);  // 디버깅 로그 추가
    }

    if (!user) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      const expiredUser = await User.findOne({ verificationToken: req.params.token });
      console.log('만료된 사용자:', expiredUser);  // 디버깅 로그 추가

      if (expiredUser) {
        // 해당 사용자 삭제
        await User.deleteOne({ _id: expiredUser._id });
        console.log('만료된 사용자 삭제됨');  // 디버깅 로그 추가
      }
      return res.status(400).json({ 
        error: '인증 기간이 만료되었습니다. 다시 회원가입을 진행해주세요.',
        requireReregistration: true 
      });
    }

    // 인증 성공
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    console.log('인증 완료됨');  // 디버깅 로그 추가

    res.json({ message: '이메일 인증이 완료되었습니다.' });
  } catch (error) {
    console.error('이메일 인증 처리 중 에러:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
});

// 로그인 라우트 수정
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('로그인 시도:', username);

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        error: '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
        needVerification: true 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        pageId: user.pageId
      }
    });

  } catch (error) {
    console.error('로그인 처리 중 에러:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 