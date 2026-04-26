import { server as WebSocketServer, connection } from "websocket";
import http from "http";
import {
  IncomingMessage,
  InitMessageType,
  SupportedMessage,
} from "./messages/incomingMessages";
import {
  OutgoingMessage,
  SupportedMessage as OutgoingSupportedMessage,
} from "./messages/outgoingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/InMemoryStore";
import { Store } from "./store/Store";

const server = http.createServer(function (request: any, response: any) {
  console.log(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function () {
  console.log(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

function originIsAllowed(origin: string) {
  return true;
}

wsServer.on("request", function (request) {
  console.log("inside connect");

  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log(
      new Date() + " Connection from origin " + request.origin + " rejected.",
    );
    return;
  }

  var connection = request.accept(null, request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", function (message) {
    console.log(message);
    if (message.type === "utf8") {
      try {
        console.log(JSON.stringify(message));
        messageHandler(connection, JSON.parse(message.utf8Data));
      } catch (e) {}
    }
  });
});

function messageHandler(ws: connection, message: IncomingMessage) {
  if (message.type == SupportedMessage.JoinRoom) {
    const payload = message.payload;
    userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
  }
  if (message.type == SupportedMessage.SendMessage) {
    const payload = message.payload;
    const user = userManager.getUser(payload.roomId, payload.userId);
    console.log("Incoming message = ", message);
    console.log("first");
    if (!user) {
      console.log("user not found");
    } else {
      console.log("second");
      let chat = store.addChat(
        payload.userId,
        user?.name,
        payload.roomId,
        payload.message,
      );
      if (!chat) {
        return;
      } else {
        console.log("third");
        const outgoingPayload: OutgoingMessage = {
          type: OutgoingSupportedMessage.AddChat,
          payload: {
            chatId: chat.id,
            roomId: payload.roomId,
            message: payload.message,
            name: user.name,
            upvotes: 0,
          },
        };
        console.log(outgoingPayload);
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
      }
    }
  }
  if (message.type == SupportedMessage.UpvoteMessage) {
    const payload = message.payload;

    const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
    if (!chat) {
      return;
    } else {
      const outgoingPayload: OutgoingMessage = {
        type: OutgoingSupportedMessage.UpdateChat,
        payload: {
          chatId: payload.chatId,
          roomId: payload.roomId,
          upvotes: chat.upvotes.length,
        },
      };
      userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
  }
}
