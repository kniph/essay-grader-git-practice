console.log('=== GRADE FUNCTION START ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.slice(0, 8));
exports.handler = async (event, context) => {
  // 先處理 CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }


  try {
    const { essay } = JSON.parse(event.body);
    
    if (!essay) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: '請提供作文內容' })
      };
    }

    // OpenAI API 調用
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `請根據以下評分標準評分學生作文：

評分標準：
第二部分：段落寫作級分說明
5級分：正確表達題目之要求；文法、用字等幾乎無誤。
4級分：大致正確表達題目之要求；文法、用字等有誤，但不影響讀者之理解。
3級分：大致回答題目之要求，但未能完全達意；文法、用字等有誤，稍影響讀者之理解。
2級分：部分回答題目之要求，表達上有令人不解/誤解之處；文法、用字等皆有誤，讀者須耐心解讀。
1級分：僅回答1個問題或重點；文法、用字等錯誤過多，嚴重影響讀者之理解。
0級分：未答、等同未答。

學生作文：
${essay}

請按以下格式回覆（使用繁體中文）：
1. 辨識文字：[重新打出學生的作文內容]
2. 錯誤列表：[條列每個錯誤並提供正確表達方式]
3. 改寫版本：[完整的修正版本]
4. 整體評級：[0-5級分及理由]
5. 建議改進方式：[具體的學習建議]`
        }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const gradeResult = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        result: gradeResult,
        success: true 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: '評分過程發生錯誤', 
        details: error.message 
      })
    };
  }
};