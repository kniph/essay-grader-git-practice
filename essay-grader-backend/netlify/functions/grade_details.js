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
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `請你扮演一位嚴格且專業的英文作文老師，針對下方學生作文，請務必「逐句」檢查，找出每一句的所有文法、拼字、用字、標點、語意、邏輯等錯誤，並詳細說明每個錯誤的類型、原因與正確寫法。  
請不要省略任何錯誤，即使是小錯也要列出。  
每一句都要有獨立的錯誤分析，若該句無錯誤，請明確標註「本句無錯誤」。  
**請在所有句子都分析完畢後，再根據整體語意與邏輯，合併重寫成一篇自然流暢、邏輯合理的英文短文。**  
請特別注意：  
- 修改時要理解學生真正想表達的意思，不能只做表面文法修正  
- 若原文有語意不清或邏輯矛盾，請根據上下文推測最合理的意思並修正  
- 改寫時要確保整體故事連貫、時間順序正確、人物行為合理  
- 請避免 Chinglish，讓英文自然且符合母語者習慣

請用下列 JSON 格式回覆，所有欄位都要完整、具體、詳盡：

{
  "辨識文字": "（請完整重打學生原文）",
  "錯誤統計": {
    "嚴重錯誤": 0,
    "中等錯誤": 0,
    "輕微錯誤": 0,
    "總字數": 0
  },
  "詳細錯誤分析": [
    {
      "原句": "（學生原文的第一句）",
      "錯誤列表": [
        {
          "錯誤類型": "（文法/拼字/用字/標點/語意/邏輯等）",
          "錯誤說明": "（詳細說明錯誤原因）",
          "正確寫法": "（正確寫法）"
        }
        // ...本句多個錯誤
      ]
    }
    // ...多個句子
  ],
  "改寫後版本": "（請根據所有錯誤修正，合併重寫成一篇自然流暢、邏輯合理的英文短文）",
  "整體評級": "（請根據評分標準給分數與完整理由）",
  "建議改進方式": [
    "（請給三點具體建議，每點一行）"
  ],
  "主要錯誤類型": "（請簡要總結主要錯誤類型，如：文法錯誤、拼字錯誤等）"
}

【請依照上方原則與範例格式，批改下方學生作文，並用繁體中文說明每一項錯誤與建議。】

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

`
        }],
        max_tokens: 1200,
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