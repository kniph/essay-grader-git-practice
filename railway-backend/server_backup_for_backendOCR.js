const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Essay Grader API is running' });
});

// Fine-tuned GPT-4o grading endpoint
app.post('/grade-fine-tuned', async (req, res) => {
  try {
    const { essay } = req.body;
    
    if (!essay) {
      return res.status(400).json({ error: '請提供作文內容' });
    }

    // Use fine-tuned ChatGPT 4o - just send the essay text

    // OpenAI Fine-tuned GPT-4o API 請求
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.FINE_TUNED_MODEL_ID, // Your fine-tuned model ID
        messages: [
          { 
            role: 'system', 
            content: '你是專門評分GEPT初級英語寫作的AI助理。必須嚴格執行以下評分標準：\n\n【GEPT評分標準-嚴格執行】\n5級分：完美作文，0-1個輕微錯誤\n4級分：良好作文，2-3個輕微錯誤，無嚴重錯誤\n3級分：普通作文，4-6個錯誤，可有1-2個嚴重錯誤\n2級分：較差作文，7-10個錯誤，多個嚴重錯誤\n1級分：很差作文，10個以上錯誤\n0級分：未答或無法理解\n\n【強制要求】\n1. 分數必須是整數(0,1,2,3,4,5)，絕對不可用小數點\n2. 有不完整句子=最高3級分\n3. 嚴重錯誤超過3個=最高2級分\n4. 所有說明使用繁體中文，但不可在說明中使用雙引號，改用單引號或括弧\n5. temperature設為0以確保一致性\n6. JSON格式中絕對不可在字串值內使用雙引號\n\nUse this exact structure: {"sentence_error_analysis":[{"location":"","issue":""}],"error_statistics":{"critical":0,"medium":0,"minor":0},"revised_versions":{"basic_correction":"","advanced_model_answer":""},"gept_rating":{"score":0,"comment":""},"improvement_suggestions":{"immediate":"","mid_term":"","long_term":""},"main_error_types_statistics":{"grammar":0,"word_choice":0,"logic":0,"spelling":0,"punctuation":0,"chinglish":0}}'
          },
          { role: 'user', content: essay }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let gradeResult = data.choices[0].message.content;

    // Fix JSON format issues - clean up non-JSON content
    try {
      // First try to parse as-is
      JSON.parse(gradeResult);
    } catch (e) {
      console.log('Original content:', gradeResult.substring(0, 200));
      
      // If parsing fails, try to fix common issues
      // Remove markdown formatting and extract JSON
      let cleanedResult = gradeResult;
      
      // Remove markdown asterisks
      cleanedResult = cleanedResult.replace(/\*\*/g, '');
      cleanedResult = cleanedResult.replace(/\*/g, '');
      
      // Try to extract JSON from response if it's mixed with other text
      const jsonMatch = cleanedResult.match(/\{.*\}/s);
      if (jsonMatch) {
        cleanedResult = jsonMatch[0];
      }
      
      // Fix common JSON issues
      console.log('Before cleaning:', cleanedResult.substring(0, 500));
      
      cleanedResult = cleanedResult
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        
        // Step 1: Fix specific patterns from the error
        .replace(/should be \\"([^"]*)\\" \(/g, 'should be "$1" (')
        .replace(/\\"([^"]*)\\" not \\"([^"]*)\\" after/g, '"$1" not "$2" after')
        .replace(/no \\"([^"]*)\\" needed/g, 'no "$1" needed')
        
        // Step 2: General fix for unescaped quotes in string values
        .replace(/"issue":\s*"([^"]*\\"[^"]*(?:\\"[^"]*)*)"/g, (match, content) => {
          // Fix the content by properly escaping internal quotes
          const fixedContent = content
            .replace(/\\"/g, 'TEMP_QUOTE')  // Temporarily replace escaped quotes
            .replace(/"/g, '\\"')           // Escape unescaped quotes
            .replace(/TEMP_QUOTE/g, '\\"'); // Restore escaped quotes
          return '"issue":"' + fixedContent + '"';
        })
        
        .replace(/"\s*:\s*"/g, '":"')  // Fix spacing around colons
        // Remove any comment field from content_summary
        .replace(/"content_summary":\s*\{[^}]*"comment"[^}]*\}/g, (match) => {
          return match.replace(/,?\s*"comment":\s*"[^"]*"/g, '');
        })
        // Fix malformed sentence_error_analysis structure
        .replace(/\{"errors":\["([^"]+)","([^"]+)"\]\}/g, '{"location":"$1","issue":"$2"}')
        .replace(/\{"errors":\[([^\]]+)\]\}/g, (match, content) => {
          const items = content.split(',').map(item => item.trim().replace(/"/g, ''));
          if (items.length >= 2) {
            return '{"location":"' + items[0] + '","issue":"' + items.slice(1).join(' ') + '"}';
          }
          return '{"location":"unknown","issue":"' + content + '"}';
        })
        .trim();
      
      gradeResult = cleanedResult;
      
      // Try parsing again
      try {
        JSON.parse(gradeResult);
        console.log('Successfully cleaned JSON');
      } catch (e2) {
        console.error('JSON parsing still failed after cleanup:', e2);
        console.error('Error details:', e2.message);
        console.error('Cleaned content (first 1000 chars):', gradeResult.substring(0, 1000));
        
        // Last attempt: Try to fix the most common issue patterns
        gradeResult = gradeResult
          .replace(/\\"([^"]*)\\" \(/g, '"$1" (')
          .replace(/\\"([^"]*)\\" not/g, '"$1" not')
          .replace(/should be \\"([^"]*)\\"/g, 'should be "$1"')
          .replace(/no \\"([^"]*)\\" needed/g, 'no "$1" needed');
        
        try {
          JSON.parse(gradeResult);
          console.log('Fixed on second attempt');
        } catch (e3) {
          console.error('Still failed after second attempt:', e3.message);
        }
      }
    }

    res.json({ 
      result: gradeResult,
      success: true 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: '評分過程發生錯誤', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});