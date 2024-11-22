const { sendVerificationEmail } = require('../config/emailConfig');

router.post('/register', async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;

    // 이메일 인증 토큰 생성
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = new User({
      username,
      displayName,
      email,
      password,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24시간
      isEmailVerified: false
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 이메일 인증 라우트
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: '이메일 인증이 완료되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); 