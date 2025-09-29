// Test OpenAI API connection
const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  console.log('🧠 Testing OpenAI API Connection...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.log('❌ OpenAI API key not set in .env file');
    console.log('Please add your API key: OPENAI_API_KEY=sk-...');
    return;
  }
  
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('📡 Making test API call...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Generate a brief trading signal analysis for RELIANCE stock with current price ₹2,450. Just 2-3 sentences.'
        }
      ],
      max_tokens: 100
    });
    
    console.log('✅ OpenAI API Connected Successfully!');
    console.log('🎯 Sample Response:', response.choices[0].message.content);
    console.log('💰 Tokens Used:', response.usage.total_tokens);
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('🔑 Invalid API key. Please check your OPENAI_API_KEY in .env');
    } else if (error.code === 'insufficient_quota') {
      console.log('💳 Insufficient credits. Please add billing to your OpenAI account');
    }
  }
}

testOpenAI();
