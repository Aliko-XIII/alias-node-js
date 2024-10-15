import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import { AppModule } from '../../../app.module';
import { DatabaseService } from '../../../database/database.service';
import request from 'supertest';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import {
  createTestUser,
  createTestRoom,
  createTestTeam,
} from '../stubs/test-data-creators.stub';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { mockAuthGuard } from '../../__mocks__/users-auth.guard.mock';

describe('UsersController (Integration)', () => {
  let dbConnection: Connection;
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('rooms').deleteMany({});
    await dbConnection.collection('teams').deleteMany({});
    await dbConnection.collection('archivedUsers').deleteMany({});
  });

  describe('findAll: GET /users', () => {
    it('should return all users sorted by score in descending order matching UserSafeDto', async () => {
      const users = await Promise.all([
        await createTestUser('testuser1', 'StrongPass1!'),
        await createTestUser('testuser2', 'StrongPass2!'),
        await createTestUser('testuser3', 'StrongPass3!'),
      ]);
      await dbConnection.collection('users').insertMany(users);

      const response = await request(httpServer).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].score).toBeGreaterThanOrEqual(
        response.body[1].score,
      );
      expect(response.body[1].score).toBeGreaterThanOrEqual(
        response.body[2].score,
      );
      response.body.forEach((user) => {
        const originalUser = users.find((u) => u.username === user.username);
        expect(user).toHaveProperty('userId');
        expect(user).toHaveProperty('username', originalUser?.username);
        expect(user).toHaveProperty('score', originalUser?.score);
        expect(user).toHaveProperty('played', originalUser?.played);
        expect(user).toHaveProperty('wins', originalUser?.wins);
      });
    });

    it('should return an empty array if there are no users', async () => {
      const response = await request(httpServer).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('findOne: GET /users/:userId', () => {
    it('should return a specified user by id matching UserSafeDto', async () => {
      const user = await createTestUser('testuser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);

      const response = await request(httpServer).get(`/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', userId.toString());
      expect(response.body).toHaveProperty('username', user.username);
      expect(response.body).toHaveProperty('score', user.score);
      expect(response.body).toHaveProperty('played', user.played);
      expect(response.body).toHaveProperty('wins', user.wins);
      expect(response.body).not.toHaveProperty('hashedPassword');
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(httpServer).get(`/users/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual('User not found.');
    });
  });

  describe('update: PATCH /users/:userId', () => {
    const updateData: UpdateUserDto = { username: 'updatedUser' };

    it('should update a specified user by id', async () => {
      const user = await createTestUser('tesUpdateUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);

      const response = await request(httpServer)
        .patch(`/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', userId.toString());
      expect(response.body).toHaveProperty('username', updateData.username);
      expect(response.body).toHaveProperty('score', user.score);
      expect(response.body).toHaveProperty('played', user.played);
      expect(response.body).toHaveProperty('wins', user.wins);
      expect(response.body).not.toHaveProperty('hashedPassword');
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(httpServer)
        .patch(`/users/${fakeId}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toEqual('User not found.');
    });
  });

  describe('remove: DELETE /users/:userId', () => {
    it('should soft delete a user', async () => {
      const user = await createTestUser('deleteuser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);

      const response = await request(httpServer)
        .delete(`/users/${userId}`)
        .query({ hardDelete: 'false' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        'User account soft deleted and moved to archive successfully.',
      );

      const archivedUser = await dbConnection
        .collection('archivedUsers')
        .findOne({ _id: userId });
      expect(archivedUser).not.toBeNull();
      expect(archivedUser.username).toBe('deleteuser1');

      const deletedUser = await dbConnection
        .collection('users')
        .findOne({ _id: userId });
      expect(deletedUser).toBeNull();
    });

    it('should hard delete a user', async () => {
      const user = await createTestUser('deleteuser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);

      const response = await request(httpServer)
        .delete(`/users/${userId}`)
        .query({ hardDelete: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User account permanently deleted.');

      const deletedUser = await dbConnection
        .collection('users')
        .findOne({ _id: userId });

      expect(deletedUser).toBeNull();
    });

    it('should return 404 if the user is not found for deletion', async () => {
      const fakeUserId = new Types.ObjectId();

      const response = await request(httpServer).delete(`/users/${fakeUserId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
    });
  });

  describe('joinRoom: POST /users/:userId/room/join', () => {
    it('should add the specified user in the room', async () => {
      const user = await createTestUser('testJoinUser1', 'StrongPass1!');
      const { insertedId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const rooms = [createTestRoom('JoinRoom1'), createTestRoom('JoinRoom2')];
      await dbConnection.collection('rooms').insertMany(rooms);

      const response = await request(httpServer).post(
        `/users/${insertedId}/room/join`,
      );

      expect(response.status).toBe(201);
      expect(response.body.joinedUsers).toContainEqual(insertedId.toString());
    });

    it('should return 404 if the user is not found available rooms to join', async () => {
      const user = await createTestUser('testJoinUser2', 'StrongPass2!');
      const { insertedId } = await dbConnection
        .collection('users')
        .insertOne(user);

      const response = await request(httpServer).post(
        `/users/${insertedId}/room/join`,
      );

      expect(response.status).toBe(404);
    });

    it('should not add a user to the room twice', async () => {
      const user = await createTestUser('testJoinUser1', 'StrongPass1!');
      const { insertedId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const room = createTestRoom('RoomWithUser', [insertedId]);
      await dbConnection.collection('rooms').insertOne(room);

      const response = await request(httpServer).post(
        `/users/${insertedId}/room/join`,
      );

      expect(response.status).toBe(201);
      expect(response.body.joinedUsers).toHaveLength(1);
    });
  });

  describe('leaveRoom: DELETE /users/:userId/room/leave/:roomId', () => {
    it('should remove the specified user from the room', async () => {
      const user = await createTestUser('leaveRoomUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const room = createTestRoom('RoomToLeave', [userId]);
      const { insertedId: roomId } = await dbConnection
        .collection('rooms')
        .insertOne(room);

      const response = await request(httpServer)
        .delete(`/users/${userId}/room/leave/${roomId}`)
        .send();

      expect(response.status).toBe(200);

      const updatedRoom = await dbConnection
        .collection('rooms')
        .findOne({ _id: roomId });

      expect(updatedRoom.joinedUsers).not.toContainEqual(userId);
    });

    it('should return 404 if the room is not found', async () => {
      const user = await createTestUser('leaveRoomUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const room = createTestRoom('RoomToLeave', [userId]);
      await dbConnection.collection('rooms').insertOne(room);
      const fakeRoomId = new Types.ObjectId();

      const response = await request(httpServer)
        .delete(`/users/${userId}/room/leave/${fakeRoomId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        `Room with ID ${fakeRoomId} is not found`,
      );
    });
  });

  describe('joinTeam: POST /users/:userId/team/join/:teamId', () => {
    it('should add the specified user to the team', async () => {
      const user = await createTestUser('joinTeamUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const room = createTestRoom('RoomToJoinTeam', [userId]);
      const { insertedId: roomId } = await dbConnection
        .collection('rooms')
        .insertOne(room);
      const team = createTestTeam('TeamToJoin', roomId, []);
      const { insertedId: teamId } = await dbConnection
        .collection('teams')
        .insertOne(team);

      const response = await request(httpServer)
        .post(`/users/${userId}/team/join/${teamId}`)
        .send();

      expect(response.status).toBe(201);

      const updatedTeam = await dbConnection
        .collection('teams')
        .findOne({ _id: teamId });

      expect(updatedTeam.players).toContainEqual(userId);
    });

    it('should return 404 if the team is not found', async () => {
      const user = await createTestUser('joinTeamUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const fakeTeamId = new Types.ObjectId();

      const response = await request(httpServer)
        .post(`/users/${userId}/team/join/${fakeTeamId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Team not found.');
    });
  });

  describe('leaveTeam: DELETE /users/:userId/team/leave/:teamId', () => {
    it('should remove the specified user from the team', async () => {
      const user = await createTestUser('leaveTeamUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const team = createTestTeam('TeamToLeave', new Types.ObjectId(), [
        userId,
      ]);
      const { insertedId: teamId } = await dbConnection
        .collection('teams')
        .insertOne(team);

      const response = await request(httpServer)
        .delete(`/users/${userId}/team/leave/${teamId}`)
        .send();

      expect(response.status).toBe(200);

      const updatedTeam = await dbConnection
        .collection('teams')
        .findOne({ _id: teamId });

      expect(updatedTeam.players).not.toContainEqual(userId);
    });

    it('should return 404 if the team is not found', async () => {
      const user = await createTestUser('leaveTeamUser1', 'StrongPass1!');
      const { insertedId: userId } = await dbConnection
        .collection('users')
        .insertOne(user);
      const fakeTeamId = new Types.ObjectId();

      const response = await request(httpServer)
        .delete(`/users/${userId}/team/leave/${fakeTeamId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Team not found.');
    });
  });
});
