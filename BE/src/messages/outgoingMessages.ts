export enum SupportedMessage {
  AddChat = "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
}

type MessagePaylod = {
  roomId: string;
  message: string;
  name: string;
  upvotes: number;
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
