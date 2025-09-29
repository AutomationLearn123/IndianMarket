console.log('=== TESTING IMPORTS ===');

try {
  console.log('1. Testing express import...');
  const express = require('express');
  console.log('✅ Express imported successfully');

  console.log('2. Testing app config import...');
  const { appConfig } = require('./src/utils/config');
  console.log('✅ Config imported successfully');

  console.log('3. Testing logger import...');
  const { Logger } = require('./src/utils/logger');
  console.log('✅ Logger imported successfully');

  console.log('4. Testing KiteService import...');
  const { KiteService } = require('./src/services/KiteService');
  console.log('✅ KiteService imported successfully');

  console.log('5. Testing LLMTradingAnalyzer import...');
  const { LLMTradingAnalyzer } = require('./src/services/LLMTradingAnalyzer');
  console.log('✅ LLMTradingAnalyzer imported successfully');

  console.log('\n🎉 All imports successful!');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}
