var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');
var authlogin = require('./middleware/auth');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var goodsRouter = require('./routes/goods');
var categoryRouter = require('./routes/category');
var ordersRouter = require('./routes/orders');
var addressRouter = require('./routes/address');
var reviewsRouter = require('./routes/reviews');
var babyCultureRouter = require('./routes/babyCulture');
var dashboardRouter = require('./routes/dashboard');
var babyRouter = require('./routes/baby');
var chatRouter = require('./routes/chat');

var app = express();

// ========== CORS 配置 - 必须放在所有路由之前 ==========
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有来源（开发环境）
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200
};

// 应用 CORS 中间件
app.use(cors(corsOptions));

// 处理预检请求
app.options('*', cors(corsOptions));

// ========== CORS 配置结束 ==========

// 静态文件服务（用于访问上传的图片）
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 注册上传路由
app.use('/upload', require('./routes/upload'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

app.use(logger('dev'));

// 修改请求体大小限制 - 增加限制到 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ========== 路由配置 ==========
app.use('/favorite', require('./routes/favorite'));
app.use('/chat', require('./routes/chat'));
app.use('/discount', require('./routes/discount'));
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/goods', goodsRouter);
app.use('/category', categoryRouter);
app.use('/orders', ordersRouter);
app.use('/address', addressRouter);
app.use('/reviews', reviewsRouter);
app.use('/baby-culture', babyCultureRouter);
app.use('/dashboard', dashboardRouter);
app.use('/baby', babyRouter);
app.use('/coupon', require('./routes/coupon'));
app.use('/search', require('./routes/search'));
app.use('/cart', require('./routes/cart'));
app.use('/ai', require('./routes/ai'));
app.use('/points', require('./routes/points'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // 处理 413 错误（请求体过大）
  if (err.status === 413) {
    return res.status(413).json({
      code: 413,
      message: '上传的文件过大，请压缩后重试或选择较小的文件'
    });
  }
  
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;