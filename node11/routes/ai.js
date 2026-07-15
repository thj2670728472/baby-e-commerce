var express = require('express');
var router = express.Router();
var axios = require('axios');

// 配置你的大模型 AP以 通义千问
const AI_CONFIG = {
  apiKey: 'sk-7f8af0573b684b4fbd5295f357363bf8',
  apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-turbo'
};

// AI 对话接口
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    // messages = [{ role: 'user', content: '宝宝6个月能吃什么辅食？' }]
    
    // 添加系统提示词
    const systemPrompt = {
      role: 'system',
      content: '你是一个专业的母婴育儿顾问，回答关于婴儿护理、喂养、早教等方面的问题，无关的不回答。回答简洁易懂。'
    };
    //调用模型API
    const response = await axios.post(AI_CONFIG.apiUrl, {
      model: AI_CONFIG.model,
      messages: [systemPrompt, ...messages],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      code: 200,
      data: {
        content: response.data.choices[0].message.content,
        role: 'assistant'
      }
    });
  } catch (error) {
    console.error('AI 调用失败:', error.message);
    res.json({ code: 500, message: 'AI 服务暂时不可用' });
  }
});

// 根据婴儿信息推荐食谱
router.post('/recommend-food', async (req, res) => {
  try {
    const { babyAge, allergy } = req.body;
    
    const prompt = `为一个${babyAge}个月的宝宝推荐3个适合的辅食食谱。${allergy ? '注意避开' + allergy + '过敏。' : ''}请用中文回答，格式简洁。`;
    
    const response = await axios.post(AI_CONFIG.apiUrl, {
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      code: 200,
      data: { content: response.data.choices[0].message.content }
    });
  } catch (error) {
    res.json({ code: 500, message: '推荐失败' });
  }
});

module.exports = router;