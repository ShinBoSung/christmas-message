const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pageId: {
    type: String,
    unique: true,
    default: function() {
      return 'page_' + Math.random().toString(36).substr(2, 9);
    },
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date
});

const passwordValidator = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return false;
  if (!hasUpperCase || !hasLowerCase) return false;
  if (!hasNumbers) return false;
  if (!hasSpecialChar) return false;

  return true;
};

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    if (!passwordValidator(this.password)) {
      throw new Error('비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다.');
    }
    this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
  }
  if (!this.pageId) {
    this.pageId = 'page_' + Math.random().toString(36).substr(2, 9);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 