import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { Connection, Types } from 'mongoose';
import { DatabaseService } from '../../../database/database.service';
import request from 'supertest';
import { createLeaderboardsStub } from '../stubs/create-leaderboards.stub';
import { leaderboardsStub } from '../stubs/leaderboards.stub';

describe('LeaderboardsController (Integration)', () => {
  let dbConnection: Connection;
  let httpServer: any;
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  describe('findAll', () => {
    it('should return the top 10 users from the leaderboard', async () => {
      await dbConnection
        .collection('users')
        .insertMany([...createLeaderboardsStub()]);

      const response = await request(httpServer).get('/leaderboards');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
      expect(response.body).toEqual(leaderboardsStub());
    });

    it('should return an empty array if there are no users', async () => {
      const response = await request(httpServer).get('/leaderboards');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return a maximum of 10 users with correct sorting', async () => {
      const testUsers = Array.from({ length: 15 }, (_, i) => ({
        _id: new Types.ObjectId(),
        username: `TestUser${i}`,
        played: 50 + i,
        score: 1000 + i,
        wins: 50 + i,
      }));
      await dbConnection.collection('users').insertMany(testUsers);

      const response = await request(httpServer).get('/leaderboards');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
      expect(response.body[0].score).toBeGreaterThan(response.body[9].score);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if there is a server error', async () => {
      await dbConnection.close();

      const response = await request(httpServer).get('/leaderboards');

      expect(response.status).toBe(500);
    });
  });
});
