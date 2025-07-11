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
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `請根據以下評分標準評分學生作文：

## 核心原則：語意優先，邏輯合理

**重要提醒：**
- 在修改錯誤時，必須仔細分析上下文的邏輯脈絡和語意連貫性
- 不要只是機械式地修正文法，要理解學生真正想表達的意思
- 確保修改後的句子在整篇文章中邏輯合理、時間順序正確
- 如果學生的表達有歧義，請選擇最符合上下文邏輯的解釋
- 修改後請再次檢查整篇文章的連貫性和合理性
- 特別注意識別和修正 Chinglish 表達方式，如「go to + 動詞原形」、直譯式介詞使用等中式英語錯誤
- 注重句子的自然流暢度，適當合併相關句子，使表達更符合英語習慣和邏輯順序
- 避免只做表面文法修正，要追求整體表達的自然性和可讀性

### 當遇到學生表達不清或詞不達意的句子時：

1. **分析整體語境**
   - 閱讀前後文，理解故事的整體脈絡
   - 識別時間順序和因果關係
   - 確定人物動機和行為邏輯

2. **推測學生真實意圖**
   - 考慮學生的語言程度和常見表達習慣
   - 分析可能的中文思維模式
   - 判斷最符合故事邏輯的解釋方向

3. **邏輯合理性檢查**
   - 修改後的句子是否符合生活常理？
   - 時間、地點、人物行為是否協調一致？
   - 是否與前後文形成合理的因果關係？

4. **多重可能性處理原則**
   當一個句子有多種修改可能時：
   - **優先選擇**：最符合上下文邏輯的版本
   - **次要考量**：語法難度適中、表達自然的版本
   - **避免選擇**：邏輯突兀、過於複雜的版本

5. **具體操作步驟**

   步驟1：理解原句 → 這句話可能想表達什麼？
   步驟2：分析語境 → 根據前後文，什麼情況最合理？
   步驟3：邏輯檢驗 → 這個解釋在故事中說得通嗎？
   步驟4：自然表達 → 如何用最自然的英文表達這個意思？
  

### 常見語意不清情況的處理策略：

**情況A：時間地點模糊**
- 原文："Today go home, his toe was broke"
- 分析：可能是「回家路上」或「在家時」受傷
- 選擇標準：哪個更符合日常生活邏輯？
- 建議：選擇「在家時踩到釘子」（更常見的受傷情境）

**情況B：因果關係不明**
- 分析前因後果，選擇最自然的邏輯鏈
- 確保修改後的因果關係清晰合理

**情況C：人物動機不清**
- 考慮人物性格和故事背景
- 選擇最符合人物設定的行為動機

### 修改後的自我檢查清單：
□ 整篇文章的時間線是否一致？
□ 人物行為是否符合邏輯？
□ 場景轉換是否自然？
□ 因果關係是否清楚？
□ 是否避免了不合理的生活情境？


### 邏輯矛盾處理原則：

**當遇到故事邏輯矛盾時（如：腳受傷不能打籃球，卻能打排球）：**

1. **分析矛盾本質**
   - 識別邏輯衝突點（受傷部位vs活動需求）
   - 理解學生真正想表達的意圖

2. **選擇修改方向的優先順序**
   - **第一優先**：保持故事主題一致性，延續核心興趣/夢想
   - **第二優先**：選擇邏輯完全合理的替代活動
   - **第三優先**：確保人物性格發展的連貫性

3. **具體處理策略**
   - **興趣延續法**：將原興趣轉向相關但可行的方向
     例：球員夢想 → 教練夢想 → 觀察分析比賽
   - **能力轉換法**：從身體活動轉向腦力活動
     例：不能打球 → 研究戰術 → 學習指導
   - **完全替代法**：只在前兩種方法不適用時使用

4. **修改範例**
   
   錯誤邏輯：腳受傷 → 不能打籃球 → 改打排球
   正確修改：腳受傷 → 不能打籃球 → 研究籃球戰術，夢想成為教練
   

### 特別注意：
- 寧可選擇簡單但邏輯清晰的表達，也不要複雜但邏輯混亂的句子
- 修改時要考慮學生的語言程度，避免使用過於高級的詞彙或句型
- **保持故事的核心主題和人物夢想的連貫性**
- **讓挫折轉換成更深層的興趣發展，而非完全放棄**
- 確保修改後的故事更有意義和啟發性

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

請根據上述原則，批改下方學生作文，並依下列格式回覆（使用繁體中文）：
1. 辨識文字：[請完整重新打出學生的作文內容或辨識內容]
2. 錯誤統計：[統計各類型錯誤的數量，例如：嚴重錯誤x2、中等錯誤x1、輕微錯誤x1和總字數]
3. 詳細錯誤分析：[條列每個錯誤，格式：原句 → 修正句，並簡要說明錯誤類型，針對每個錯誤，說明原因、影響、如何修正]
4. 改寫版本：[根據上述原則，給出邏輯合理、語意通順的完整修正版]
5. 整體評級：[0-5級分及理由，請明確說明依據]
6. 建議改進方式：[具體的學習建議，針對本篇作文的弱點]
7. 主要錯誤類型：[列出本篇最常見的錯誤類型，例如：語意不清、Chinglish、時態錯誤等]`
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