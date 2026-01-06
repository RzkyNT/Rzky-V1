const fetch = require("node-fetch");

const Apis = ["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"]

const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

async function openai(prompt, question, model) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from model.";
  } catch (error) {
    console.error("Error:", error);
    return "Error while fetching response.";
  }
}

module.exports = openai