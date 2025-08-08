const messagesByNumber = {};

export function saveMessage(number, messageData) {
  if (!messagesByNumber[number]) {
    messagesByNumber[number] = [];
  }
  messagesByNumber[number].push(messageData);
  console.log('check-message-number-------->', messagesByNumber);

}

export function getMessages(number) {
  return messagesByNumber[number] || [];
  
}