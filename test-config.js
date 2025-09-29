console.log('Testing config loading...');

try {
  console.log('Loading dotenv...');
  require('dotenv').config();
  
  console.log('Loading config module...');
  const { appConfig } = require('./dist/utils/config');
  
  console.log('Config loaded:', {
    port: appConfig.port,
    nodeEnv: appConfig.nodeEnv,
    kiteApiKey: appConfig.kiteApiKey ? 'SET' : 'NOT SET'
  });
  
} catch (error) {
  console.error('Config loading failed:', error.message);
  console.error('Stack:', error.stack);
}
