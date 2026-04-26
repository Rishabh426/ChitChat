export type userId = string;

export interface Chat {
  id: string;
  userId: userId;
  name: string;
  message: string;
  upvotes: userId[];
}

export abstract class Store {
  constructor() {}
  initRoom(roomId: string) {}
  getChats(roomId: string, limit: number, offset: number) {}
  addChat(userId: userId, name: string, roomId: string, message: string) {}
  upvote(userId: userId, roomId: string, chatId: string) {}
}
