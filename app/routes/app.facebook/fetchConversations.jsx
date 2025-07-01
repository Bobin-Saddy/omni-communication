export async function fetchPageConversations(pageAccessToken, pageId) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=participants,message_count&access_token=${pageAccessToken}`
  );
  const data = await response.json();
  return data;
}
