const express = require('express');
const router = express.Router();
const User = require('../models/User');

// pageId로 사용자 정보 조회
router.get('/api/pages/:pageId', async (req, res) => {
  try {
    console.log('페이지 정보 요청:', req.params.pageId);
    const user = await User.findOne({ pageId: req.params.pageId });
    
    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    }

    console.log('찾은 사용자 정보:', {
      displayName: user.displayName,
      username: user.username,
      pageId: user.pageId
    });

    res.json({
      displayName: user.displayName,
      username: user.username,
      pageId: user.pageId
    });
  } catch (error) {
    console.error('페이지 정보 조회 중 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 