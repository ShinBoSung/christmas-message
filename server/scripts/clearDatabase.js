const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('데이터베이스 연결 성공');

    // 모든 사용자 데이터 삭제
    const result = await User.deleteMany({});
    
    console.log(`${result.deletedCount}개의 계정이 삭제되었습니다.`);
    console.log('데이터베이스 초기화가 완료되었습니다.');
    
    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
    process.exit(1);
  }
};

// 실행 전 확인 메시지
console.log('경고: 이 작업은 모든 사용자 데이터를 영구적으로 삭제합니다.');
console.log('계속하시려면 아무 키나 누르세요...');

process.stdin.once('data', () => {
  clearDatabase();
}); 