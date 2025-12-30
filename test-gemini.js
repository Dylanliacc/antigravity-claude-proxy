async function testGemini() {
  console.log("Testing gemini-3-flash with stream: false...");
  const response = await fetch("http://localhost:8080/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "dummy",
    },
    body: JSON.stringify({
      model: "claude-gemini-3-flash",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 100,
      stream: false,
    }),
  });

  if (!response.ok) {
    console.error("Error:", await response.text());
    return;
  }

  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
