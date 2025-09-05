// public/upload.js

export async function handleFileUpload(file, store, sessionId, name, list, BASE_URL) {
  const localId = 'file-' + Date.now();

  // Display temporary bubble
  const b = document.createElement('div'); 
  b.className = 'oc-bubble oc-me oc-file-bubble';
  b.dataset.id = localId;

  if(file.type.startsWith('image/')){
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    b.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = file.name;
    b.appendChild(span);
  }

  list.appendChild(b);
  list.scrollTop = list.scrollHeight;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storeDomain', store);
    formData.append('sessionId', sessionId);
    formData.append('sender', 'customer');
    formData.append('name', name);

    const endpoint = "https://omnichannel-communication-3d7329b35a37.herokuapp.com/api/chat";
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json().catch(() => null);

    if (data && data.ok && data.message) {
      b.innerHTML = ''; // clear temporary content
      const fullUrl = data.message.fileUrl.startsWith("http")
        ? data.message.fileUrl
        : BASE_URL + data.message.fileUrl.replace(/^\//, "");

      if (fullUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
        const img = document.createElement('img');
        img.src = fullUrl;
        b.appendChild(img);
      } else if (data.message.fileName) {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.textContent = data.message.fileName;
        link.target = "_blank";
        b.appendChild(link);
      }
    }
  } catch (e) {
    console.warn('upload error', e);
  }
}
