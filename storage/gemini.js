const fetch = require("node-fetch");

async function geminiChat(text, sessionId = "default") {
  let sankaFailed = false;
  let davidFailed = false;
  
  // Primary: Coba Sanka API dulu
  try {
    const apiUrl = "https://www.sankavollerei.com/ai/session";
    
    // Prompt default untuk Gemini chat
    const defaultPrompt = "Kamu adalah asisten AI yang cerdas dan membantu. Jawab dengan sopan dan informatif.";
    
    // Encode parameters untuk URL
    const params = new URLSearchParams({
      apikey: "planaai",
      text: text,
      prompt: defaultPrompt,
      sessions: sessionId
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    console.log(`[Gemini] Calling Sanka API with session: ${sessionId}`);
    
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 8000 // Kurangi timeout ke 8 detik
    });

    console.log(`[Gemini] Sanka API response status: ${response.status}`);

    if (response.ok && response.status === 200) {
      const data = await response.json();
      
      // Cek struktur response dari Sanka API
      if (data && data.result) {
        console.log(`[Gemini] Using Sanka response: ${data.result.substring(0, 100)}...`);
        return data.result;
      } else if (data && data.response) {
        return data.response;
      } else if (data && data.message) {
        return data.message;
      } else if (typeof data === 'string') {
        return data;
      }
    }
    
    // Jika Sanka API gagal (status bukan 200), lanjut ke fallback
    console.log(`[Gemini] Sanka API failed with status ${response.status}, trying David Cyril fallback...`);
    sankaFailed = true;
    
  } catch (error) {
    console.error("Sanka AI Error:", error.message);
    console.log("[Gemini] Trying David Cyril fallback...");
    sankaFailed = true;
  }
  
  // Fallback 1: Gunakan API David Cyril jika Sanka gagal
  if (sankaFailed) {
    try {
      const davidUrl = "https://apis.davidcyriltech.my.id/ai/chatbot";
      const davidParams = new URLSearchParams({
        query: `Kamu adalah asisten AI yang cerdas dan membantu. Jawab dengan sopan dan informatif.\n\nUser: ${text}`,
        apikey: ""
      });
      
      const davidFullUrl = `${davidUrl}?${davidParams.toString()}`;
      
      console.log(`[Gemini] Calling David Cyril API as fallback 1`);
      
      const davidResponse = await fetch(davidFullUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 10000
      });

      console.log(`[Gemini] David Cyril API response status: ${davidResponse.status}`);

      if (davidResponse.ok) {
        const davidData = await davidResponse.json();
        
        console.log(`[Gemini] David Cyril API response data:`, davidData);
        
        // Cek struktur response dari David Cyril API
        if (davidData && davidData.result) {
          console.log(`[Gemini] Using David Cyril response: ${davidData.result.substring(0, 100)}...`);
          return davidData.result;
        } else if (davidData && davidData.response) {
          return davidData.response;
        } else if (davidData && davidData.message) {
          return davidData.message;
        } else if (davidData && davidData.data) {
          return davidData.data;
        } else if (typeof davidData === 'string') {
          return davidData;
        }
      }
      
      console.log(`[Gemini] David Cyril API failed with status ${davidResponse.status}, trying Ferdev fallback...`);
      davidFailed = true;
      
    } catch (davidError) {
      console.error("David Cyril AI Error:", davidError.message);
      console.log("[Gemini] Trying Ferdev fallback...");
      davidFailed = true;
    }
  }
  
  // Fallback 2: Gunakan API Ferdev jika David Cyril juga gagal
  if (sankaFailed && davidFailed) {
    try {
      const ferdevUrl = "https://api.ferdev.my.id/ai/gemini";
      const ferdevParams = new URLSearchParams({
        prompt: `Kamu adalah asisten AI yang cerdas dan membantu. Jawab dengan sopan dan informatif.\n\nUser: ${text}`,
        apikey: "keysita_47JX47JX"
      });
      
      const ferdevFullUrl = `${ferdevUrl}?${ferdevParams.toString()}`;
      
      console.log(`[Gemini] Calling Ferdev API as fallback 2`);
      
      const ferdevResponse = await fetch(ferdevFullUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 10000
      });

      console.log(`[Gemini] Ferdev API response status: ${ferdevResponse.status}`);

      if (ferdevResponse.ok) {
        const ferdevData = await ferdevResponse.json();
        
        console.log(`[Gemini] Ferdev API response data:`, ferdevData);
        
        // Cek struktur response dari Ferdev API
        if (ferdevData && ferdevData.message) {
          console.log(`[Gemini] Using Ferdev response: ${ferdevData.message.substring(0, 100)}...`);
          return ferdevData.message;
        } else if (ferdevData && ferdevData.result) {
          return ferdevData.result;
        } else if (ferdevData && ferdevData.response) {
          return ferdevData.response;
        } else if (ferdevData && ferdevData.data) {
          return ferdevData.data;
        } else if (typeof ferdevData === 'string') {
          return ferdevData;
        }
      }
      
      console.error(`Ferdev API Error ${ferdevResponse.status}: ${ferdevResponse.statusText}`);
      
    } catch (ferdevError) {
      console.error("Ferdev AI Error:", ferdevError.message);
    }
  }
  
  // Jika semua API gagal, return pesan error
  return "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.";
}

module.exports = geminiChat;