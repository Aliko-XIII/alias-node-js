import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../gateways/chat.gateway';
import { MessagesService } from '../../messages/messages.service';
import { Socket } from 'socket.io';
import { CreateMessageDto } from '../../messages/dto/create-message.dto';
import { Types } from 'mongoose';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: MessagesService;
  let socket: Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: MessagesService,
          useValue: {
            saveMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    socket = {
      id: 'socket-id',
      join: jest.fn(),
    } as unknown as Socket;
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;

    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleJoinTeam', () => {
    it('should allow client to join a team room', () => {
      const data = {
        roomId: '1',
        teamId: '6703ffc8ba4a6b1dcf6095d8',
      };
      const teamRoom = `${data.roomId}-${data.teamId}`;

      gateway.handleJoinTeam(socket, data);

      expect(socket.join).toHaveBeenCalledWith(teamRoom);
      expect(console.log).toHaveBeenCalledWith(
        `Client ${socket.id} joined room ${teamRoom}`,
      );
    });
  });

  describe('handleMessage', () => {
    it('should save a message and emit it to the correct room', async () => {
      const data: CreateMessageDto = {
        roomId: '1' as unknown as Types.ObjectId,
        teamId: '6703ffc8ba4a6b1dcf6095d8' as unknown as Types.ObjectId,
        userId: '6703fff1ba4a6b1dcf609705' as unknown as Types.ObjectId,
        userName: 'test',
        text: 'Hello Team!',
      };
      const savedMessage = { ...data, id: '67054d2aee2c032f2bd710a0' };
      const teamRoom = `${data.roomId}-${data.teamId}`;

      (messagesService.saveMessage as jest.Mock).mockResolvedValue(
        savedMessage,
      );
      await gateway.handleMessage(socket, data);

      expect(messagesService.saveMessage).toHaveBeenCalledWith(data);
      expect(gateway.server.to).toHaveBeenCalledWith(teamRoom);
      expect(gateway.server.to(teamRoom).emit).toHaveBeenCalledWith(
        'receiveMessage',
        savedMessage,
      );
    });
  });
});
