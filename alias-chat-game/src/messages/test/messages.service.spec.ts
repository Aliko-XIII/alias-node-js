import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MessagesService } from '../messages.service';
import { Message } from '../schemas/message.schema';
import { Model, Types } from 'mongoose';
import { CreateMessageDto } from '../dto/create-message.dto';

describe('MessagesService', () => {
  let service: MessagesService;
  let model: Model<Message>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    model = module.get<Model<Message>>(getModelToken(Message.name));
  });

  describe('saveMessage', () => {
    it('should save a message and return the created message', async () => {
      const createMessageDto: CreateMessageDto = {
        roomId: '1' as unknown as Types.ObjectId,
        teamId: '6703ffc8ba4a6b1dcf6095d8' as unknown as Types.ObjectId,
        userId: '6703fff1ba4a6b1dcf609705' as unknown as Types.ObjectId,
        userName: 'test',
        text: 'Hello Team!',
      };

      const savedMessage = {
        _id: '67054d2aee2c032f2bd710a0',
        ...createMessageDto,
      };

      (model.create as jest.Mock).mockResolvedValue(savedMessage);

      const result = await service.saveMessage(createMessageDto);

      expect(model.create).toHaveBeenCalledWith(createMessageDto);
      expect(result).toEqual(savedMessage);
    });

    it('should throw an error if message saving fails', async () => {
      const createMessageDto: CreateMessageDto = {
        roomId: '1' as unknown as Types.ObjectId,
        teamId: '6703ffc8ba4a6b1dcf6095d8' as unknown as Types.ObjectId,
        userId: '6703fff1ba4a6b1dcf609705' as unknown as Types.ObjectId,
        userName: 'test',
        text: 'Hello Team!',
      };

      (model.create as jest.Mock).mockRejectedValue(
        new Error('Error saving message'),
      );

      await expect(service.saveMessage(createMessageDto)).rejects.toThrow(
        'Error saving message',
      );
    });
  });
});
