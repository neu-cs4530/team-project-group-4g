import BoundingBox from './BoundingBox';
import ConversationArea from './ConversationArea';

export type ServerConversationArea = {
  label: string;
  topic?: string;
  occupantsByID: string[];
  boundingBox: BoundingBox;
};

export type ConversationAreaListener = {
  onTopicChange?: (newTopic: string | undefined) => void;
  onOccupantsChange?: (newOccupants: string[]) => void;
};
export const NO_TOPIC_STRING = '(No topic)';
export default class Vehicle {
  private _conversationArea: ConversationArea;

  constructor(conversationArea: ConversationArea) {
    this._conversationArea = conversationArea;
  }

  get conversationArea() {
    return this._conversationArea;
  }

}
