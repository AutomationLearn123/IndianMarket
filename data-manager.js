#!/usr/bin/env node

/**
 * 📊 DATA MANAGEMENT UTILITY
 * Inspect and manage persistent market data
 */

const fs = require('fs');
const path = require('path');

class DataManager {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.persistenceFile = path.join(this.dataDir, 'market-state.json');
  }

  /**
   * 📊 Display current market data status
   */
  showStatus() {
    console.log('📊 MARKET DATA STATUS');
    console.log('═'.repeat(50));
    
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      console.log(`📁 Expected location: ${this.persistenceFile}`);
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
      const lastSave = new Date(data.lastSaveTime);
      const hoursSinceLastSave = (Date.now() - lastSave.getTime()) / (1000 * 60 * 60);
      
      console.log(`✅ Data file exists: ${this.persistenceFile}`);
      console.log(`📅 Last saved: ${lastSave.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`⏰ Hours ago: ${hoursSinceLastSave.toFixed(1)} hours`);
      console.log(`📈 Stocks tracked: ${data.marketState?.length || 0}`);
      console.log(`🚨 Signals stored: ${data.signalHistory?.length || 0}`);
      console.log(`📊 System info: v${data.systemInfo?.version || 'Unknown'}`);
      
      if (hoursSinceLastSave > 4) {
        console.log('⚠️  Data is older than 4 hours - will start fresh on next run');
      } else {
        console.log('✅ Data is recent - will restore on next startup');
      }
      
    } catch (error) {
      console.error('❌ Error reading data file:', error.message);
    }
  }

  /**
   * 📋 Show recent signals
   */
  showRecentSignals() {
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
      const signals = data.signalHistory || [];
      
      console.log('\n🚨 RECENT TRADING SIGNALS');
      console.log('═'.repeat(60));
      
      if (signals.length === 0) {
        console.log('📭 No signals recorded');
        return;
      }

      const recentSignals = signals.slice(-10); // Last 10 signals
      
      recentSignals.forEach((signal, index) => {
        const time = signal.timestamp || 'Unknown time';
        console.log(`${index + 1}. ${signal.symbol}: ${signal.signal} (${signal.confidence}%)`);
        console.log(`   💰 Entry: ₹${signal.entry} | Target: ₹${signal.target} | Stop: ₹${signal.stopLoss}`);
        console.log(`   🧠 ${signal.reasoning}`);
        console.log(`   🕐 ${time}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Error reading signals:', error.message);
    }
  }

  /**
   * 📊 Show stock-wise data summary
   */
  showStockSummary() {
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
      const marketState = new Map(data.marketState || []);
      
      console.log('\n📈 STOCK DATA SUMMARY');
      console.log('═'.repeat(60));
      console.log('Stock        | Ticks | Vol History | Price History | Last Update');
      console.log('─'.repeat(60));
      
      for (const [symbol, state] of marketState.entries()) {
        const tickCount = state.tickHistory?.length || 0;
        const volCount = state.volumeHistory?.length || 0;
        const priceCount = state.priceHistory?.length || 0;
        const lastUpdate = state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'Never';
        
        console.log(`${symbol.padEnd(12)} | ${tickCount.toString().padStart(5)} | ${volCount.toString().padStart(11)} | ${priceCount.toString().padStart(13)} | ${lastUpdate}`);
      }
      
    } catch (error) {
      console.error('❌ Error reading stock data:', error.message);
    }
  }

  /**
   * 🧹 Clean old data
   */
  cleanData() {
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      return;
    }

    try {
      // Create backup before cleaning
      const backupFile = this.persistenceFile.replace('.json', `-backup-${Date.now()}.json`);
      fs.copyFileSync(this.persistenceFile, backupFile);
      console.log(`📦 Backup created: ${backupFile}`);
      
      // Remove main data file
      fs.unlinkSync(this.persistenceFile);
      console.log('🧹 Market data cleaned - next startup will be fresh');
      
    } catch (error) {
      console.error('❌ Error cleaning data:', error.message);
    }
  }

  /**
   * 💾 Create data backup
   */
  backupData() {
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.dataDir, `market-state-backup-${timestamp}.json`);
      
      fs.copyFileSync(this.persistenceFile, backupFile);
      console.log(`📦 Backup created: ${backupFile}`);
      
    } catch (error) {
      console.error('❌ Error creating backup:', error.message);
    }
  }

  /**
   * 📁 Show file size and disk usage
   */
  showFileInfo() {
    if (!fs.existsSync(this.persistenceFile)) {
      console.log('❌ No market data file found');
      return;
    }

    try {
      const stats = fs.statSync(this.persistenceFile);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('\n📁 FILE INFORMATION');
      console.log('═'.repeat(40));
      console.log(`📄 File: ${path.basename(this.persistenceFile)}`);
      console.log(`📏 Size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
      console.log(`📅 Created: ${stats.birthtime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`📝 Modified: ${stats.mtime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      
    } catch (error) {
      console.error('❌ Error reading file info:', error.message);
    }
  }

  /**
   * 📋 Show usage help
   */
  showHelp() {
    console.log('📊 DATA MANAGEMENT UTILITY');
    console.log('═'.repeat(50));
    console.log('Available commands:');
    console.log('');
    console.log('node data-manager.js status     - Show data status');
    console.log('node data-manager.js signals    - Show recent signals');
    console.log('node data-manager.js stocks     - Show stock summary');
    console.log('node data-manager.js info       - Show file information');
    console.log('node data-manager.js backup     - Create data backup');
    console.log('node data-manager.js clean      - Clean old data');
    console.log('node data-manager.js help       - Show this help');
    console.log('');
  }
}

// Command line interface
if (require.main === module) {
  const manager = new DataManager();
  const command = process.argv[2] || 'status';
  
  switch (command.toLowerCase()) {
    case 'status':
      manager.showStatus();
      break;
    case 'signals':
      manager.showRecentSignals();
      break;
    case 'stocks':
      manager.showStockSummary();
      break;
    case 'info':
      manager.showFileInfo();
      break;
    case 'backup':
      manager.backupData();
      break;
    case 'clean':
      manager.cleanData();
      break;
    case 'help':
      manager.showHelp();
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      manager.showHelp();
  }
}

module.exports = DataManager;