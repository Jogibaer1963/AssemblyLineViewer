import "dotenv/config";
import OpenAI from "openai";

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API...\n');

  // 1. Check API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is missing in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  // 2. Initialize OpenAI client
  const openai = new OpenAI({ apiKey });

  try {
    // 3. Test with a simple completion
    console.log('\n📤 Sending test request to OpenAI...\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello! OpenAI is working!' in one sentence." }
      ],
      max_tokens: 50
    });

    console.log('✅ OpenAI API is working!\n');
    console.log('📨 Response:');
    console.log('─────────────────────────────────────');
    console.log(completion.choices[0].message.content);
    console.log('─────────────────────────────────────\n');

    // 4. Show usage info
    console.log('📊 Usage:');
    console.log(`  - Model: ${completion.model}`);
    console.log(`  - Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);
    console.log(`  - Prompt tokens: ${completion.usage?.prompt_tokens || 'N/A'}`);
    console.log(`  - Completion tokens: ${completion.usage?.completion_tokens || 'N/A'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ OpenAI API Error:\n');

    if (error.status === 401) {
      console.error('🔑 Authentication Error: Invalid API Key');
      console.error('   Please check your OPENAI_API_KEY in .env file');
    } else if (error.status === 429) {
      console.error('⏳ Rate Limit Error: Too many requests');
      console.error('   Please wait a moment and try again');
    } else if (error.status === 500) {
      console.error('🔧 OpenAI Server Error');
      console.error('   The OpenAI service is experiencing issues');
    } else {
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }

    process.exit(1);
  }
}

testOpenAI().then();
