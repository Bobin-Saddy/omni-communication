const fetchPageConversations = async (PAGE_ID, PAGE_ACCESS_TOKEN, nextURL = null) => {
  try {
    const url = nextURL || `https://graph.facebook.com/v20.0/${PAGE_ID}/conversations?access_token=${PAGE_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    // Append new conversations to existing state
    setConversations(prev => [...prev, ...(data.data || [])]);

    // If there's another page, fetch it recursively
    if (data.paging && data.paging.next) {
      await fetchPageConversations(PAGE_ID, PAGE_ACCESS_TOKEN, data.paging.next);
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
  }
};
