const express = require('express');
const WebSocket = require('ws');
const path = require("path")
const app = express();
const server = app.listen(3000, () => {
  console.log('Server started on port 3000');
});

const wss = new WebSocket.Server({ server });

let userCount = 0;
const messageHistory = [];
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast updated user count to all connected clients
function broadcastUserCount() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'userCount', userCount }));
    }
  });
}

wss.on("connection", (ws) => {
  userCount++;
  console.log(`${userCount} users online`);

  // Broadcast updated user count to all clients
  broadcastUserCount();

  // Send chat history to the newly connected client
  ws.send(JSON.stringify({ type: 'history', data: messageHistory }));

  ws.on("message", (message) => {
    console.log(`Received: ${message.toString()}`);

    // Add the message to the history
    messageHistory.push(message.toString());

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', data: message.toString() }));
      }
    });
  });

  ws.on("close", () => {
    userCount--;
    console.log(`${userCount} users online`);
    broadcastUserCount();
  });

  ws.on("error", (error) => {
    console.error("WebSocket error", error);
  });
});

app.get("/", (req, res) => {
  res.render("onlineChat.ejs", { userCount }); // Pass the initial userCount
});
