const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const generatePageId = () => {
  return 'page_' + Math.random().toString(36).substr(2, 9);
};

const migratePageIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('데이터베이스 연결 성공');

    // pageId가 없는 모든 사용자 조회
    const users = await User.find({ pageId: { $exists: false } });
    
    console.log(`${users.length}개의 계정에 대해 마이그레이션을 시작합니다.`);

    for (const user of users) {
      const pageId = generatePageId();
      await User.findByIdAndUpdate(user._id, { pageId });
      console.log(`사용자 ${user.username}의 pageId가 ${pageId}로 업데이트되었습니다.`);
    }

    console.log('마이그레이션이 완료되었습니다.');
    process.exit(0);
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
};

migratePageIds(); 