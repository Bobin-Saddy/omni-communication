// // webhook.js
// import express from "express";
// const router = express.Router();

// let unreadMessages = {}; // { conversationId: count }

// router.post("/webhook", (req, res) => {
//   const body = req.body;

//   if (body.object === "page") {
//     body.entry.forEach(function(entry) {
//       const messaging = entry.messaging[0];
//       const senderId = messaging.sender.id;
//       const recipientId = messaging.recipient.id;
//       const message = messaging.message;

//       if (message && senderId !== 544704651303656) {
//         const conversationId = messaging.sender.id; // Use sender ID as conversation ID

//         if (!unreadMessages[conversationId]) {
//           unreadMessages[conversationId] = 0;
//         }
//         unreadMessages[conversationId] += 1;
//       }
//     });

//     res.status(200).send("EVENT_RECEIVED");
//   } else {
//     res.sendStatus(404);
//   }
// });

// export { unreadMessages };
// export default router;
