console.log('=== GRADE FUNCTION START ===');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY?.slice(0, 8));

exports.handler = async (event, context) => {
  // 處理 CORS preflight
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

    // 高品質重寫版 prompt
    const prompt = `作為專業英文作文老師，請分析學生作文並提供高品質重寫。

重寫原則：
1. 理解學生真正想表達的意思
2. 修正文法、時態、用字錯誤
3. 澄清模糊或不清楚的表達
4. 確保句子間的邏輯連貫
5. 使用自然的英文表達，避免中式英文

評分標準：
5級分：文法、用字幾乎無誤
4級分：有誤但不影響理解  
3級分：有誤稍影響理解
2級分：錯誤較多需耐心解讀
1級分：錯誤過多嚴重影響理解
0級分：未答或等同未答

學生作文：${essay}

請用此JSON格式回覆：
{
  "辨識文字": "完整重打原文",
  "關鍵錯誤": [
    {
      "原文": "錯誤的原文片段",
      "問題": "具體問題說明",
      "修正": "正確的表達方式"
    }
  ],
  "專業重寫": "完整重寫版本（自然流暢、邏輯清晰、符合英文母語者習慣）",
  "評級": "X級分：詳細理由",
  "改進建議": "具體學習建議"
}

直接回傳JSON。`;

    // Claude API 請求
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    // Claude 回傳內容在 data.content[0].text
    const gradeResult = data.content[0].text;

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