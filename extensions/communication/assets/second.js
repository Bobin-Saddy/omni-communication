document.addEventListener("DOMContentLoaded", function () {
  const FACEBOOK_APP_ID = "544704651303656";
  let currentView = "login";
  let pageAccessTokens = {};
  let selectedPage = null;
  let recipientId = null;
  let selectedConversation = null;

  const igChatButton = document.getElementById("ig-chat-button");
  const igChatBox = document.getElementById("ig-chat-box");
  const igLoginButton = document.getElementById("ig-login-button");
  const igBackButton = document.getElementById("ig-back-button");
  const igPagesContainer = document.getElementById("ig-pages-container");
  const igConversationsContainer = document.getElementById("ig-conversations-container");
  const igMessagesContainer = document.getElementById("ig-messages-container");

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

  igChatButton.onclick = () => igChatBox.classList.toggle("show");

  igLoginButton.onclick = () => {
    FB.login(function (response) {
      if (response.authResponse) {
        fetchIGPages(response.authResponse.accessToken);
      }
    }, {
      scope: "pages_show_list,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_messaging"
    });
  };

  function fetchIGPages(token) {
    fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        igPagesContainer.innerHTML = "";
        data.data.forEach(page => {
          pageAccessTokens[page.id] = page.access_token;
          fetch(`https://graph.facebook.com/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
            .then(res => res.json())
            .then(res => {
              const igId = res.instagram_business_account?.id;
              if (igId) {
                const btn = document.createElement("button");
                btn.textContent = `${page.name} (IG)`;
                btn.onclick = () => fetchIGConversations(igId, page);
                igPagesContainer.appendChild(btn);
              }
            });
        });
        igLoginButton.style.display = "none";
        igBackButton.style.display = "block";
        igPagesContainer.style.display = "block";
        currentView = "pages";
      });
  }

  function fetchIGConversations(igId, page) {
    selectedPage = page;
    fetch(`https://graph.facebook.com/${page.id}/conversations?platform=instagram&fields=participants&access_token=${page.access_token}`)
      .then(res => res.json())
      .then(data => {
        igConversationsContainer.innerHTML = "";
        data.data.forEach(conv => {
          const btn = document.createElement("button");
          btn.textContent = conv.participants.data.map(p => p.name || "IG User").join(', ');
          btn.onclick = () => fetchIGMessages(conv);
          igConversationsContainer.appendChild(btn);
        });
        igPagesContainer.style.display = "none";
        igConversationsContainer.style.display = "block";
        currentView = "conversations";
      });
  }

  function fetchIGMessages(conversation) {
    selectedConversation = conversation;
    const accessToken = pageAccessTokens[selectedPage.id];
    recipientId = conversation.participants?.data?.find(p => p.id !== selectedPage.id)?.id || null;
    igMessagesContainer.innerHTML = "";

    const input = document.createElement("input");
    input.placeholder = "Type a message...";
    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send";
    sendBtn.onclick = () => sendIGMessage(input.value, input);
    igMessagesContainer.append(input, sendBtn);

    const pollMessages = () => {
      fetch(`https://graph.facebook.com/${conversation.id}/messages?access_token=${accessToken}`)
        .then(res => res.json())
        .then(data => {
          igMessagesContainer.innerHTML = "";
          data.data.reverse().forEach(msg => {
            const div = document.createElement("div");
            div.textContent = `${msg.from.name}: ${msg.message}`;
            igMessagesContainer.appendChild(div);
          });
          igMessagesContainer.append(input, sendBtn);
        });
    };

    pollMessages();
    if (window.igPoll) clearInterval(window.igPoll);
    window.igPoll = setInterval(pollMessages, 3000);
    igConversationsContainer.style.display = "none";
    igMessagesContainer.style.display = "flex";
    currentView = "messages";
  }

  function sendIGMessage(text, inputEl) {
    const accessToken = pageAccessTokens[selectedPage.id];
    fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: "MESSAGE_TAG",
        tag: "ACCOUNT_UPDATE",
      })
    }).then(() => inputEl.value = "");
  }

  igBackButton.onclick = () => {
    if (currentView === "messages") {
      igMessagesContainer.style.display = "none";
      igConversationsContainer.style.display = "block";
      currentView = "conversations";
    } else if (currentView === "conversations") {
      igConversationsContainer.style.display = "none";
      igPagesContainer.style.display = "block";
      currentView = "pages";
    } else if (currentView === "pages") {
      igPagesContainer.style.display = "none";
      igLoginButton.style.display = "block";
      igBackButton.style.display = "none";
      currentView = "login";
    }
  };
});