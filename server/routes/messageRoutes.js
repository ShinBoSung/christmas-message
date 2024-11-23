const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// 메시지 저장
router.post('/messages', async (req, res) => {
  try {
    console.log('메시지 저장 요청:', req.body);  // 디버깅 로그
    const { text, recipientPageId, senderName } = req.body;

    // pageId로 사용자 찾기
    const recipient = await User.findOne({ pageId: recipientPageId });
    if (!recipient) {
      console.log('수신자를 찾을 수 없음:', recipientPageId);  // 디버깅 로그
      return res.status(404).json({ error: '메시지를 받을 사용자를 찾을 수 없습니다.' });
    }

    const message = new Message({
      text,
      recipientId: recipient._id,
      senderName,
      createdAt: new Date()
    });

    await message.save();
    console.log('메시지 저장 성공:', message);  // 디버깅 로그

    res.status(201).json({ message: '메시지가 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('메시지 저장 중 에러:', error);
    res.status(500).json({ error: '메시지 저장에 실패했습니다.' });
  }
});

// 메시지 조회
router.get('/messages/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const isOwner = req.query.isOwner === 'true';
    
    // pageId로 사용자 찾기
    const recipient = await User.findOne({ pageId });
    if (!recipient) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 크리스마스인지 확인
    const now = new Date();
    const isChristmas = now.getMonth() === 11 && now.getDate() === 25;

    if (isOwner) {
      if (isChristmas) {
        // 크리스마스에는 모든 메시지 반환
        const messages = await Message.find({ recipientId: recipient._id })
          .sort({ createdAt: -1 });
        res.json({ isChristmas: true, messages });
      } else {
        // 크리스마스가 아니면 메시지 개수만 반환
        const count = await Message.countDocuments({ recipientId: recipient._id });
        res.json({ isChristmas: false, count });
      }
    } else {
      // 방문자는 메시지 개수만 볼 수 있음
      const count = await Message.countDocuments({ recipientId: recipient._id });
      res.json({ count });
    }
  } catch (error) {
    console.error('메시지 조회 중 에러:', error);
    res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
  }
});

module.exports = router; 