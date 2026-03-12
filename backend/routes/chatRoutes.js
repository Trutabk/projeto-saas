const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { sendMessage, getHistory } = require('../controllers/chatController');

router.post('/message', protect, upload.array('files', 5), sendMessage);
router.get('/history', protect, getHistory);

module.exports = router;
