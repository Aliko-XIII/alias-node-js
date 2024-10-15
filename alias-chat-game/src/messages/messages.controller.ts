import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ParseObjectIdPipe } from '../parse-id.pipe';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * @route GET /api/v1/messages
   * @description Retrieve all messages
   */
  @Get()
  async findAll() {
    return await this.messagesService.getMessages();
  }

  /**
   * @route GET /api/v1/messages/{messageId}
   * @description Retrieve a specified message by id
   */
  @Get(':messageId')
  async findOne(
    @Param('messageId', ParseObjectIdPipe) messageId: Types.ObjectId,
  ) {
    return await this.messagesService.getById(messageId);
  }

  /**
   * @route DELETE /api/v1/messages/{messageId}
   * @description Delete a specified message by id
   */
  @Delete(':messageId')
  async remove(
    @Param('messageId', ParseObjectIdPipe) messageId: Types.ObjectId,
  ) {
    return this.messagesService.deleteMessage(messageId);
  }
}
