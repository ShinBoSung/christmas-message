const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Gmail 앱 비밀번호 사용
  }
});

const sendVerificationEmail = async (to, verificationToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Secret Santa - 이메일 인증',
    html: `
      <h2>Secret Santa 이메일 인증</h2>
      <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
      <a href="${process.env.CLIENT_URL}/verify-email/${verificationToken}">이메일 인증하기</a>
      <p>링크는 24시간 동안 유효합니다.</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail }; 