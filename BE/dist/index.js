"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const websocket_1 = require("websocket");
const incomingMessages_1 = require("./messages/incomingMessages");
const outgoingMessages_1 = require("./messages/outgoingMessages");
const UserManager_1 = require("./UserManager");
const InMemoryStore_1 = require("./store/InMemoryStore");
const app = (0, express_1.default)();
const userManager = new UserManager_1.UserManager();
const store = new InMemoryStore_1.InMemoryStore();
const server = app.listen(8080, () => {
    console.log(new Date() + " Server is listening on port 8080");
});
const wsServer = new websocket_1.server({
    httpServer: server,
    autoAcceptConnections: false,
});
function originIsAllowed(origin) {
    return true;
}
wsServer.on("request", function (request) {
    console.log("inside connect");
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log(new Date() + " Connection from origin " + request.origin + " rejected.");
        return;
    }
    const connection = request.accept("echo-protocol", request.origin);
    console.log(new Date() + " Connection accepted.");
    connection.on("message", function (message) {
        console.log(message);
        if (message.type === "utf8") {
            try {
                console.log(JSON.stringify(message));
                messageHandler(connection, JSON.parse(message.utf8Data));
            }
            catch (e) { }
        }
    });
});
function messageHandler(ws, message) {
    if (message.type == incomingMessages_1.SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }
    if (message.type == incomingMessages_1.SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        console.log("Incoming message = ", message);
        console.log("first");
        if (!user) {
            console.log("user not found");
        }
        else {
            console.log("second");
            let chat = store.addChat(payload.userId, user === null || user === void 0 ? void 0 : user.name, payload.roomId, payload.message);
            if (!chat) {
                return;
            }
            else {
                try {
                    const outgoingPayload = {
                        type: outgoingMessages_1.SupportedMessage.AddChat,
                        payload: {
                            chatId: chat.id,
                            roomId: payload.roomId,
                            message: payload.message,
                            name: user.name,
                            upvotes: 0,
                        },
                    };
                    console.log("outoging payload = ", outgoingPayload);
                    ws.sendUTF(JSON.stringify(outgoingPayload));
                    userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
    }
    if (message.type == incomingMessages_1.SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        if (!chat) {
            return;
        }
        else {
            const outgoingPayload = {
                type: outgoingMessages_1.SupportedMessage.UpdateChat,
                payload: {
                    chatId: payload.chatId,
                    roomId: payload.roomId,
                    upvotes: chat.upvotes.length,
                },
            };
            console.log("checking payload");
            console.log(outgoingPayload);
            const upvoter = userManager.getUser(payload.roomId, payload.userId);
            upvoter === null || upvoter === void 0 ? void 0 : upvoter.conn.sendUTF(JSON.stringify(outgoingPayload));
            userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
        }
    }
}
