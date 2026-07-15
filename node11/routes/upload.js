var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 上传图片
router.post('/image', upload.single('file'), function(req, res) {
  if (!req.file) {
    return res.json({ code: 400, message: '请选择图片' });
  }
  const url = '/uploads/avatars/' + req.file.filename;
  res.json({ code: 200, message: '上传成功', data: { url } });
});

// 上传 base64 图片
router.post('/base64', function(req, res) {
  const base64Data = req.body.image;
  if (!base64Data) {
    return res.json({ code: 400, message: '请提供图片数据' });
  }
  
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    return res.json({ code: 400, message: '图片格式错误' });
  }
  
  const ext = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  const filename = 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext;
  const uploadDir = path.join(__dirname, '../public/uploads/avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, buffer);
  
  const url = '/uploads/avatars/' + filename;
  res.json({ code: 200, message: '上传成功', data: { url } });
});

module.exports = router;