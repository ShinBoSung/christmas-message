router.get('/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    if (user.pageId) {
      return res.redirect(`/pages/${user.pageId}`);
    }
    // ... 기존 로직
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.get('/pages/:pageId', async (req, res) => {
  try {
    const user = await User.findOne({ pageId: req.params.pageId });
    if (!user) {
      return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    }
    // ... 나머지 로직
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}); 