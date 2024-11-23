const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendVerificationEmail = async (to, verificationToken) => {
  try {
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

    const info = await transporter.sendMail(mailOptions);
    console.log('이메일 발송 성공:', info.response);
    return info;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail }; 