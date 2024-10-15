import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client';
import { AppModule } from '../../../app.module';
import { CreateMessageDto } from '../../../messages/dto/create-message.dto';
import * as io from 'socket.io-client';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { mockAuthGuard } from '../../../users/__mocks__/users-auth.guard.mock';
import { DatabaseService } from '../../../database/database.service';
import { Connection, Types } from 'mongoose';

describe('Chat And Message Integration Test', () => {
  let app: INestApplication;
  let server: Server;
  let socket: Socket;
  let dbConnection: Connection;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getDbHandle();
    server = app.getHttpServer().listen(8080);
  });

  afterAll(async () => {
    await socket.disconnect();
    await server.close();
    await app.close();
  });

  beforeEach((done) => {
    socket = io.connect('http://localhost:8080', {
      reconnection: false,
    });
    socket.on('connect', () => {
      done();
    });
  });

  it('should save a message and emit it to the room', (done) => {
    const createMessageDto: CreateMessageDto = {
      roomId: '1' as unknown as Types.ObjectId,
      teamId: '6703ffc8ba4a6b1dcf6095d8' as unknown as Types.ObjectId,
      userId: '67054d2aee2c032f2bd710a0' as unknown as Types.ObjectId,
      userName: 'userForTeam6',
      text: 'hello',
    };

    socket.emit('joinTeam', {
      roomId: createMessageDto.roomId,
      teamId: createMessageDto.teamId,
    });

    socket.on('receiveMessage', async (message) => {
      expect(message.text).toEqual(createMessageDto.text);
      expect(message).toHaveProperty('_id');

      const savedMessage = await dbConnection
        .collection('messages')
        .findOne({ _id: new Types.ObjectId(message._id) });

      expect(savedMessage).toBeTruthy();
      expect(savedMessage.roomId).toEqual(createMessageDto.roomId);
      expect(savedMessage.teamId).toEqual(createMessageDto.teamId);
      expect(savedMessage.userId).toEqual(createMessageDto.userId);
      expect(savedMessage.userName).toEqual(createMessageDto.userName);
      expect(savedMessage.text).toEqual(createMessageDto.text);

      done();
    });

    socket.emit('sendMessage', createMessageDto);
  });
});
