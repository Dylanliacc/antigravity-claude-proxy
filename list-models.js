async function listModels() {
  const response = await fetch("http://localhost:8080/v1/models", {
    headers: {
      "x-api-key": "dummy",
    },
  });

  if (!response.ok) {
    console.error("Error:", await response.text());
    return;
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listModels().catch(console.error);
