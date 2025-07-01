app.get("/api/facebook/conversations", async (req, res) => {
  const pageAccessToken = "EAAbkNd1CHq4BOynG9dCUL7ModRfUiP5efEgFFOZC0amWKmkMG7pa6qHnBtfzxbVTZA5r3ZBhrNPAFyLgRYw5SRAo928c7UjCPJi1LlIPpbal2o4ExscgGVZA3P3F2Km3qjcjtIGitiI6nwZARWeerjhvgfqpZBa5hPVbefdUnxFwmkBbZCSdb8YUZAveuDYrKVoIsf8TZBCAnWSBGg18VXB2xraSmr2qZCQWsnTjHbqU2stj1Opyx36VsZCtf9UtoUasNLLpw7DbKZBk7QZDZD";
  const pageId = "756074130914844";

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}/conversations?access_token=${pageAccessToken}`
    );

    const conversations = data.data;

    // Fetch participants for each conversation
    const userPromises = conversations.map(async (conv) => {
      const { data } = await axios.get(
        `https://graph.facebook.com/v18.0/${conv.id}/participants?access_token=${pageAccessToken}`
      );
      return data.data[0]; // Assuming first participant is the user
    });

    const users = await Promise.all(userPromises);

    res.json(users);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});
