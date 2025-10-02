#!/usr/bin/env node

/**
 * QUICK BUG TEST FOR ENHANCED SYSTEM
 * Test the LLM response parsing
 */

// Sample LLM response that should be BUY but gets parsed as NO_GOOD
const sampleLLMResponse = `### ENHANCED ANALYSIS FOR AXISBANK

**SIGNAL:** BUY
**CONFIDENCE:** 85%
**ENTRY_PRICE:** ₹1141.00
**TARGET_PRICE:** ₹1142.93 (Resistance 2)
**STOP_LOSS:** ₹1137.00 (POC)
**RISK_REWARD_RATIO:** 1:3

**ANALYSIS:**
- Strong breakout above A TPO level
- Volume increase confirming momentum
- Market Profile shows bullish structure
- CPR levels support upward move

**RECOMMENDATION:** Strong BUY with tight risk management`;

console.log('🔍 TESTING LLM RESPONSE PARSING');
console.log('═══════════════════════════════════════');

// Current parsing logic (simplified)
function parseEnhancedLLMResponse(content) {
  const result = {
    signal: 'NO_GOOD',
    confidence: 0,
    entryPrice: null,
    targetPrice: null,
    stopLoss: null,
    grade: 'POOR',
    reasoning: content
  };

  try {
    // Try to extract signal
    const signalMatch = content.match(/\*\*SIGNAL:\*\*\s*(\w+)/i);
    const confidenceMatch = content.match(/\*\*CONFIDENCE:\*\*\s*(\d+)/i);
    const entryMatch = content.match(/\*\*ENTRY_PRICE:\*\*\s*₹?(\d+\.?\d*)/i);
    const targetMatch = content.match(/\*\*TARGET_PRICE:\*\*\s*₹?(\d+\.?\d*)/i);
    const stopMatch = content.match(/\*\*STOP_LOSS:\*\*\s*₹?(\d+\.?\d*)/i);

    console.log('📊 Pattern Matches:');
    console.log('Signal Match:', signalMatch ? signalMatch[1] : 'NOT FOUND');
    console.log('Confidence Match:', confidenceMatch ? confidenceMatch[1] : 'NOT FOUND');
    console.log('Entry Match:', entryMatch ? entryMatch[1] : 'NOT FOUND');
    console.log('Target Match:', targetMatch ? targetMatch[1] : 'NOT FOUND');
    console.log('Stop Match:', stopMatch ? stopMatch[1] : 'NOT FOUND');

    if (signalMatch) {
      result.signal = signalMatch[1].toUpperCase();
      console.log('✅ Signal extracted:', result.signal);
    } else {
      console.log('❌ Signal extraction failed');
    }

    if (confidenceMatch) {
      result.confidence = parseInt(confidenceMatch[1]);
      console.log('✅ Confidence extracted:', result.confidence);
    } else {
      console.log('❌ Confidence extraction failed');
    }

    // Grade determination
    if (result.signal === 'BUY' || result.signal === 'SELL') {
      if (result.confidence >= 80) {
        result.grade = 'EXCELLENT';
        console.log('✅ Grade set to EXCELLENT');
      } else if (result.confidence >= 70) {
        result.grade = 'GOOD';
        console.log('✅ Grade set to GOOD');
      }
    }

    if (entryMatch) result.entryPrice = parseFloat(entryMatch[1]);
    if (targetMatch) result.targetPrice = parseFloat(targetMatch[1]);
    if (stopMatch) result.stopLoss = parseFloat(stopMatch[1]);

  } catch (error) {
    console.log('❌ Parsing Error:', error.message);
  }

  return result;
}

// Test the parsing
console.log('\n🧪 TESTING WITH SAMPLE RESPONSE:');
console.log('Raw LLM Response:');
console.log(sampleLLMResponse);

console.log('\n📊 PARSING RESULTS:');
const parsed = parseEnhancedLLMResponse(sampleLLMResponse);
console.log('Final Result:', JSON.stringify(parsed, null, 2));

console.log('\n🎯 EXPECTED vs ACTUAL:');
console.log('Expected Signal: BUY');
console.log('Actual Signal:', parsed.signal);
console.log('Expected Confidence: 85');
console.log('Actual Confidence:', parsed.confidence);
console.log('Expected Grade: EXCELLENT');
console.log('Actual Grade:', parsed.grade);

// Diagnosis
console.log('\n🔍 DIAGNOSIS:');
if (parsed.signal === 'BUY' && parsed.confidence === 85 && parsed.grade === 'EXCELLENT') {
  console.log('✅ PARSING WORKS CORRECTLY!');
  console.log('🔍 The issue may be elsewhere in the enhanced system');
} else {
  console.log('❌ PARSING BUG CONFIRMED!');
  console.log('🔧 The enhanced system parsing logic needs fixing');
}

console.log('\n🚀 Your manual observation of AXISBANK breakout is likely CORRECT!');
console.log('🎯 The system should show BUY signal, not NO_GOOD');