#!/usr/bin/env node

const { invokeLLM } = require('./inspiration/ads_engineer_planner/server/_core/llm.ts');

require('dotenv').config({ path: './inspiration/ads_engineer_planner/.env' });

const provider = process.argv[2] || 'openai';
const testMessage = {
  role: 'user',
  content: 'Respond with "Hello from [provider]!" where [provider] is AI provider name.'
};

async function testProvider(providerName) {
  console.log(`\n🧪 Testing ${providerName.toUpperCase()} provider...`);
  
  try {
    const response = await invokeLLM({
      provider: providerName,
      messages: [testMessage],
      maxTokens: 100
    });

    console.log(`✅ ${providerName.toUpperCase()} SUCCESS`);
    console.log(`📝 Response: ${response.choices[0].message.content}`);
    console.log(`🔧 Model: ${response.model}`);
    console.log(`💰 Tokens used: ${JSON.stringify(response.usage)}`);
    
  } catch (error) {
    console.log(`❌ ${providerName.toUpperCase()} FAILED`);
    console.log(`🚨 Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Testing AI Provider Connections');
  console.log('=====================================');
  
  const providers = provider === 'all' 
    ? ['openai', 'gemini', 'anthropic', 'forge']
    : [provider];

  for (const p of providers) {
    await testProvider(p);
  }
  
  console.log('\n🏁 Test complete!');
}

main().catch(console.error);