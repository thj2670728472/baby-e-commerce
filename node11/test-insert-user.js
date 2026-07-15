const db = require('./db/mysqldb');

async function insertTestUser() {
  try {
    // 创建测试用户
    const user = await db.user.create({
      username: 'testuser',
      password: '123456',
      phone: '13800138000',
      email: 'test@example.com',
      isactive: true
    });

    console.log('测试用户创建成功！');
    console.log('用户ID:', user.id);
    console.log('用户名:', user.username);
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit();
  }
}

insertTestUser();