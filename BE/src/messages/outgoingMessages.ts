export enum SupportedMessage {
  AddChat = "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
}

export type MessagePaylod = {
  roomId: string;
  message: string;
  name: string;
  upvotes: number;
  chatId: string;
};

export type OutgoingMessage =
  | {
      type: SupportedMessage.AddChat;
      payload: MessagePaylod;
    }
  | {
      type: SupportedMessage.UpdateChat;
      payload: Partial<MessagePaylod>;
    };
