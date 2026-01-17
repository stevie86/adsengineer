import { invokeLLM } from './inspiration/ads_engineer_planner/server/_core/llm.ts';
import { ENV } from './inspiration/ads_engineer_planner/server/_core/env.ts';

async function testOpenAI() {
  console.log('Testing OpenAI...');
  try {
    const response = await invokeLLM({
      provider: 'openai',
      messages: [{ role: 'user', content: 'Say "Hello from OpenAI!"' }],
      maxTokens: 50
    });
    console.log('✅ OpenAI success:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ OpenAI failed:', error.message);
  }
}

async function testGemini() {
  console.log('Testing Gemini...');
  try {
    const response = await invokeLLM({
      provider: 'gemini', 
      messages: [{ role: 'user', content: 'Say "Hello from Gemini!"' }],
      maxTokens: 50
    });
    console.log('✅ Gemini success:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ Gemini failed:', error.message);
  }
}

async function testAnthropic() {
  console.log('Testing Anthropic...');
  try {
    const response = await invokeLLM({
      provider: 'anthropic',
      messages: [{ role: 'user', content: 'Say "Hello from Anthropic!"' }],
      maxTokens: 50
    });
    console.log('✅ Anthropic success:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ Anthropic failed:', error.message);
  }
}

async function main() {
  console.log('🚀 AI Provider Connection Tests');
  console.log('==============================');
  
  await testOpenAI();
  await testGemini();
  await testAnthropic();
  
  console.log('\n✨ Tests completed!');
}

main().catch(console.error);