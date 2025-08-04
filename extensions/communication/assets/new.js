document.addEventListener("DOMContentLoaded", function () {
  const FACEBOOK_APP_ID = "544704651303656";
  let currentView = "login";
  let pageAccessTokens = {};
  let selectedPage = null;
  let recipientId = null;
  let selectedConversation = null;
  let isInstagram = false;

  const chatButton = document.getElementById("fb-chat-button");
  const chatBox = document.getElementById("fb-chat-box");
  const fbBackButton = document.getElementById("fb-back-button");
  const fbHeaderTitle = document.getElementById("fb-header-title");
  const fbLoginButton = document.getElementById("fb-login-button");
  const igLoginButton = document.getElementById("ig-login-button");
  const pagesContainer = document.getElementById("fb-pages-container");
  const conversationsContainer = document.getElementById("fb-conversations-container");
  const messagesContainer = document.getElementById("fb-messages-container");

  window.fbAsyncInit = function () {
    FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: true, version: "v18.0" });
  };

  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");

  chatButton.addEventListener("click", function () {
    chatBox.classList.toggle("show");
  });

  fbBackButton.addEventListener("click", function () {
    if (currentView === "messages") {
      clearInterval(window.fbMessagePoll);
      messagesContainer.style.display = "none";
      conversationsContainer.style.display = "block";
      fbHeaderTitle.textContent = "Conversations";
      currentView = "conversations";
    } else if (currentView === "conversations") {
      conversationsContainer.style.display = "none";
      pagesContainer.style.display = "block";
      fbHeaderTitle.textContent = "Select a Page";
      currentView = "pages";
    } else if (currentView === "pages") {
      pagesContainer.style.display = "none";
      fbLoginButton.style.display = "block";
      igLoginButton.style.display = "block";
      fbBackButton.style.display = "none";
      fbHeaderTitle.textContent = "Chat";
      currentView = "login";
    }
  });

  fbLoginButton.addEventListener("click", function () {
    isInstagram = false;
    FB.login(function (response) {
      if (response.authResponse) {
        fetchPages(response.authResponse.accessToken);
      }
    }, {
      scope: "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging"
    });
  });

  igLoginButton.addEventListener("click", function () {
    isInstagram = true;
    FB.login(function (response) {
      if (response.authResponse) {
        fetchInstagramPages(response.authResponse.accessToken);
      }
    }, {
      scope: "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_messaging"
    });
  });

  function fetchPages(token) {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        pageAccessTokens = {};
        pagesContainer.innerHTML = "";
        data.data.forEach(page => {
          pageAccessTokens[page.id] = page.access_token;
          const btn = document.createElement("button");
          btn.textContent = `${page.name} (FB)`;
          btn.onclick = () => fetchConversations(page);
          pagesContainer.appendChild(btn);
        });
        fbLoginButton.style.display = "none";
        igLoginButton.style.display = "none";
        pagesContainer.style.display = "block";
        fbHeaderTitle.textContent = "Select a Page";
        fbBackButton.style.display = "block";
        currentView = "pages";
      });
  }

function fetchInstagramPages(token) {
  fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`)
    .then(res => res.json())
    .then(data => {
      pageAccessTokens = {};
      pagesContainer.innerHTML = "";

      data.data.forEach(page => {
        pageAccessTokens[page.id] = page.access_token;

        fetch(`https://graph.facebook.com/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
          .then(res => res.json())
          .then(res => {
            const igId = res.instagram_business_account?.id;
            console.log("Instagram Account ID:", igId);

            if (igId) {
              // ✅ Store Instagram ID into the `page` object
              page.instagram_business_account = { id: igId };

              const btn = document.createElement("button");
              btn.textContent = `${page.name} (IG)`;
              btn.onclick = () => fetchIGConversations(igId, page);  // You can also pass just `page`
              pagesContainer.appendChild(btn);
            }
          })
          .catch(err => {
            console.error("Failed to get IG business account:", err);
          });
      });

      fbLoginButton.style.display = "none";
      igLoginButton.style.display = "none";
      pagesContainer.style.display = "block";
      fbHeaderTitle.textContent = "Select Instagram Page";
      fbBackButton.style.display = "block";
      currentView = "pages";
    })
    .catch(err => {
      console.error("Failed to fetch IG pages:", err);
    });
}


  function fetchConversations(page) {
    selectedPage = page;
    fetch(`https://graph.facebook.com/${page.id}/conversations?fields=participants&access_token=${page.access_token}`)
      .then(res => res.json())
      .then(data => {
        conversationsContainer.innerHTML = "";
        data.data.forEach(conv => {
          const btn = document.createElement("button");
          btn.textContent = conv.participants.data.map(p => p.name).join(', ');
          btn.onclick = () => fetchMessages(conv);
          conversationsContainer.appendChild(btn);
        });
        pagesContainer.style.display = "none";
        conversationsContainer.style.display = "block";
        fbHeaderTitle.textContent = "Conversations";
        currentView = "conversations";
      });
  }

function fetchIGConversations(igId, page) {
  selectedPage = page;
  console.log("Fetching IG conversations for Page ID:", page.id);

  // Fetch the page's Instagram username
  function getInstagramUsername(page) {
    if (page.instagram_business_account?.id) {
      return Promise.resolve(page.instagram_business_account.id);
    }
    return fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
      .then(res => res.json())
      .then(data => data.instagram_business_account?.id);
  }

  getInstagramUsername(page).then(igBusinessId => {
    if (!igBusinessId) {
      console.error("Instagram business account ID not found for this page.");
      return;
    }

    // Fetch IG page username
    fetch(`https://graph.facebook.com/v18.0/${igBusinessId}?fields=username&access_token=${page.access_token}`)
      .then(res => res.json())
      .then(instaData => {
        const pageIGUsername = instaData.username || "Unknown IG Page";

        // Fetch IG conversations
        const url = `https://graph.facebook.com/v18.0/${page.id}/conversations`;
        const params = `?platform=instagram&fields=participants&access_token=${page.access_token}`;

        fetch(url + params)
          .then(res => res.json())
          .then(async (data) => {
            conversationsContainer.innerHTML = "";

            if (!data.data || data.data.length === 0) {
              const msg = document.createElement("div");
              msg.textContent = "No Instagram conversations found.";
              conversationsContainer.appendChild(msg);
              return;
            }

            for (const conv of data.data) {
              const user = conv.participants?.data.find(p => p.id !== page.id);

              let chatUsername = "Unknown IG User";
              if (user?.id) {
                try {
                  const userInfoRes = await fetch(`https://graph.facebook.com/v18.0/${user.id}?fields=username,name&access_token=${page.access_token}`);
                  const userInfo = await userInfoRes.json();

                  if (userInfo.name) {
                    chatUsername = userInfo.name;
                  } else if (userInfo.username) {
                    chatUsername = userInfo.username;
                  } else {
                    chatUsername = `IG User (ID: ${user.id})`;
                  }
                } catch (err) {
                  console.warn("Could not fetch username for IG user:", user.id, err);
                  chatUsername = `IG User (ID: ${user.id})`;
                }
              }

              const btn = document.createElement("button");
              btn.textContent = `${chatUsername} ↔ ${pageIGUsername}`;
              btn.onclick = () => fetchMessages(conv);
              conversationsContainer.appendChild(btn);
            }

            pagesContainer.style.display = "none";
            conversationsContainer.style.display = "block";
            fbHeaderTitle.textContent = "Conversations";
            currentView = "conversations";
          })
          .catch(err => {
            console.error("Failed to fetch IG conversations:", err);
          });
      })
      .catch(err => {
        console.error("Failed to fetch Instagram username for page:", err);
      });
  });
}







function fetchMessages(conversation) {
  selectedConversation = conversation;
  const accessToken = pageAccessTokens[selectedPage.id];
  messagesContainer.innerHTML = "";
  recipientId = null;

  // Try to get recipientId from participants
  if (conversation.participants?.data?.length > 1) {
    const otherParticipant = conversation.participants.data.find(p => p.id !== selectedPage.id);
    recipientId = otherParticipant?.id || null;
  }

  const inputContainer = document.createElement("div");
  inputContainer.id = "fb-input-container";
  const input = document.createElement("input");
  input.placeholder = "Type a message...";
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage(input.value, input);
  });
  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.onclick = () => sendMessage(input.value, input);
  inputContainer.appendChild(input);
  inputContainer.appendChild(sendBtn);
  messagesContainer.appendChild(inputContainer);

  const seenMessageIds = new Set();

  const pollMessages = () => {
    const url = `https://graph.facebook.com/v18.0/${conversation.id}/messages?fields=id,message,text,from,created_time,attachments,sticker&access_token=${accessToken}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.data) {
          console.warn("No messages found");
          return;
        }

        // Fallback recipientId logic using first message
        if (!recipientId && data.data.length > 0) {
          const firstMsg = data.data.find(m => m.from?.id !== selectedPage.id);
          if (firstMsg?.from?.id) {
            recipientId = firstMsg.from.id;
            console.log("Recipient ID (fallback):", recipientId);
          }
        }

        data.data.reverse().forEach(msg => {
          if (seenMessageIds.has(msg.id)) return;
          seenMessageIds.add(msg.id);

          const senderName = msg.from?.username || msg.from?.name || "Unknown IG User";
          const createdAt = new Date(msg.created_time).toLocaleString();
          let messageText = "";

          if (msg.message?.trim()) {
            messageText = msg.message;
          } else if (msg.text?.trim()) {
            messageText = msg.text;
          } else if (msg.sticker?.url) {
            messageText = `<img src="${msg.sticker.url}" alt="sticker" style="max-width: 100px;" />`;
          } else if (msg.attachments?.data?.length > 0) {
            const attachment = msg.attachments.data[0];
            const url = attachment.image_data?.url || attachment.payload?.url || "";

            if (attachment.mime_type?.startsWith("image")) {
              messageText = `<img src="${url}" style="max-width: 200px;" />`;
            } else if (attachment.mime_type?.startsWith("video")) {
              messageText = `<video controls style="max-width: 200px;"><source src="${url}" type="${attachment.mime_type}"></video>`;
            } else if (url) {
              messageText = `<a href="${url}" target="_blank">[Open Attachment]</a>`;
            } else {
              messageText = `[Attachment: ${attachment.mime_type}]`;
            }
          } else {
            messageText = "[Unsupported or Empty Message]";
            console.warn("⚠️ Unrecognized message format:", msg);
          }

          const div = document.createElement("div");
          div.className = `fb-message ${senderName === selectedPage.name ? 'sent' : 'received'}`;
          div.innerHTML = `
            <strong>${senderName}</strong><br>
            ${messageText}<br>
            <small>${createdAt}</small>
          `;
          messagesContainer.insertBefore(div, inputContainer);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      })
      .catch(err => {
        console.error("Error fetching messages:", err);
      });
  };

  pollMessages();
  if (window.fbMessagePoll) clearInterval(window.fbMessagePoll);
  window.fbMessagePoll = setInterval(pollMessages, 3000);

  conversationsContainer.style.display = "none";
  messagesContainer.style.display = "flex";
  fbHeaderTitle.textContent = recipientId || "Chat";
  currentView = "messages";
}


function sendMessage(text, inputEl) {
  if (!text.trim() || !recipientId) return;

  inputEl.disabled = true;

  if (!selectedPage) {
    console.error("No selected page.");
    return;
  }

  const accessToken = pageAccessTokens[selectedPage.id];

  const url = `https://graph.facebook.com/v18.0/me/messages`; // ✅ Use this for both IG and FB

  const body = {
    recipient: { id: recipientId },
    message: { text: text },
    messaging_type: "MESSAGE_TAG",
    tag: "ACCOUNT_UPDATE", // ✅ Required tag for IG messaging
  };

  fetch(`${url}?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message_id) {
        inputEl.value = "";
        console.log("Message sent ✅");
      } else {
        console.error("Message not sent:", data);
      }
    })
    .catch((err) => {
      console.error("Message send error:", err);
    })
    .finally(() => {
      inputEl.disabled = false;
      inputEl.focus();
    });
}


});