import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  /**
   * Create a new message
   */
  async saveMessage(data: CreateMessageDto) {
    return await this.messageModel.create(data);
  }

  /**
   * Get a message by id
   */
  async getById(messageId: Types.ObjectId) {
    try {
      const message = await this.messageModel.findById(messageId).exec();

      if (!message) {
        throw new NotFoundException('Message not found.');
      }

      return message;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving the message.',
      );
    }
  }

  /**
   * Get all messages
   */
  async getMessages() {
    try {
      return await this.messageModel.find().exec();
    } catch {
      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving the message list.',
      );
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: Types.ObjectId) {
    await this.getById(messageId);

    await this.messageModel.deleteOne({ _id: messageId });
    return {
      message: 'Message has been deleted successfully.',
    };
  }
}
