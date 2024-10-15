import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { Connection, Types } from 'mongoose';
import request from 'supertest';
import { DatabaseService } from '../../../database/database.service';
import { createTeamStub } from '../stubs/team.stub';

describe('TeamsController (integration)', () => {
  const createTeam = createTeamStub();
  let roomId: Types.ObjectId;
  let dbConnection: Connection;
  let httpServer: any;
  let app: any;
  let authToken: string; // Variable to hold the authentication token

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Initialize the Nest application
    app = moduleRef.createNestApplication();
    await app.init();
    dbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getDbHandle(); // Get the database connection handle
    httpServer = app.getHttpServer(); // Get the HTTP server

    await request(httpServer)
      .post('/auth/register')
      .send({
        username: 'TestUser2',
        password: 'testPass-123',
      })
      .expect(201);

    // Authenticate and get a token
    const authResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        username: 'TestUser2',
        password: 'testPass-123',
      })
      .expect(201);
    authToken = JSON.parse(authResponse.text).data.access_token;

    // Create a test room to associate teams with
    const roomResponse = await request(httpServer)
      .post('/rooms')
      .set('authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Room', teams: [], turnTime: 30 })
      .expect(201);

    roomId = roomResponse.body._id;
    createTeam.roomId = roomId;
  });

  afterAll(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('rooms').deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Clear the words collection before each test
    await dbConnection.collection('teams').deleteMany({});
    await dbConnection.collection('users').deleteMany({});
  });
  describe('POST /rooms/:roomId/teams', () => {
    it('should create a new team successfully', async () => {
      const response = await request(httpServer)
        .post(`/rooms/${roomId}/teams`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createTeam)
        .expect(201); // Expect a successful creation (201 status)
      expect(response.body).toMatchObject({
        ...createTeam,
        _id: createTeam._id.toString(),
      }); // Check response matches created team

      const createdTeam = await dbConnection
        .collection('teams')
        .findOne({ name: createTeam.name });
      expect(createdTeam).toBeTruthy(); // Ensure the team is saved in the database
    });
  });

  describe('GET /rooms/:roomId/teams', () => {
    it('should retrieve all teams in the room successfully', async () => {
      // Insert test teams into the database
      await dbConnection.collection('teams').insertMany([
        {
          ...createTeam,
          name: 'Team A',
          roomId: new Types.ObjectId(roomId), // Ensure the roomId is set correctly
          _id: new Types.ObjectId(), // Generate a new ObjectId for each team
        },
        {
          ...createTeam,
          name: 'Team B',
          roomId: new Types.ObjectId(roomId), // Ensure the roomId is set correctly
          _id: new Types.ObjectId(), // Generate a new ObjectId for each team
        },
      ]);

      // Perform request to get all teams
      const response = await request(httpServer)
        .get(`/rooms/${roomId}/teams`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful retrieval (200 status)

      // Convert the _id fields to strings in the response
      const teamsWithStringIds = response.body.map((team: any) => ({
        ...team,
        _id: team._id.toString(), // Convert ObjectId to string
      }));

      const expectedTeams = [
        {
          _id: expect.any(String),
          name: 'Team A',
          roomId: roomId,
          teamScore: 0,
          players: [],
          chatId: null,
          describer: null,
          description: null,
          tryedWords: [],
          success: null,
          teamLeader: null,
          answer: null,
          __v: 0,
        },
        {
          _id: expect.any(String),
          name: 'Team B',
          roomId: roomId,
          teamScore: 0,
          players: [],
          chatId: null,
          describer: null,
          description: null,
          tryedWords: [],
          success: null,
          teamLeader: null,
          answer: null,
          __v: 0,
        },
      ];

      // Check that the returned array contains the created teams
      expect(teamsWithStringIds).toEqual(expect.arrayContaining(expectedTeams));
    });

    it('should return an empty array if no teams exist', async () => {
      // Perform request to get all teams when none exist
      const response = await request(httpServer)
        .get(`/rooms/${roomId}/teams`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful retrieval (200 status)

      expect(response.body).toEqual([]); // Check that an empty array is returned
    });
  });

  describe('GET /rooms/:roomId/teams/:teamId', () => {
    it('should retrieve a specific team by ID successfully', async () => {
      // Insert a test team into the database
      const testTeam = {
        ...createTeam,
        name: 'Team C',
        roomId: new Types.ObjectId(roomId),
        _id: new Types.ObjectId(), // Create a new ObjectId for the team
      };
      // Insert the test team
      await dbConnection.collection('teams').insertOne(testTeam);
      // Perform a request to get the specific team by ID
      const response = await request(httpServer)
        .get(`/rooms/${roomId}/teams/${testTeam._id}`)
        .set('authorization', `Bearer ${authToken}`)
        .expect(200); // Expect a successful retrieval (200 status)

      // Convert the _id field in the response to a string for comparison
      const responseTeam = {
        ...response.body,
        _id: response.body._id.toString(),
      };

      // Check that the returned team matches the inserted test team
      expect(responseTeam).toEqual({
        ...testTeam,
        _id: expect.any(String),
        roomId: roomId.toString(), // Expect _id to be a string
      });
    });

    it('should return 404 if team does not exist', async () => {
      // Perform a request to get a team that does not exist
      const nonExistentTeamId = new Types.ObjectId(); // Generate a new ObjectId

      await request(httpServer)
        .get(`/rooms/${roomId}/teams/${nonExistentTeamId}`)
        .set('authorization', `Bearer ${authToken}`)
        .expect(404); // Expect a 404 status for a non-existent team
    });
  });

  describe('DELETE /rooms/:roomId/teams', () => {
    beforeEach(async () => {
      // Clear the teams collection before each test
      await dbConnection.collection('teams').deleteMany({});

      // Insert test teams into the database for the deletion test
      await dbConnection.collection('teams').insertMany([
        {
          name: 'Team A',
          roomId: new Types.ObjectId(roomId), // Ensure the roomId matches the one used in the delete test
          _id: new Types.ObjectId(), // Generate a new ObjectId for each team
        },
        {
          name: 'Team B',
          roomId: new Types.ObjectId(roomId), // Ensure the roomId matches the one used in the delete test
          _id: new Types.ObjectId(), // Generate a new ObjectId for each team
        },
      ]);
    });

    it('should delete all teams from a specific room successfully', async () => {
      // Perform request to delete all teams
      const response = await request(httpServer)
        .delete(`/rooms/${roomId}/teams`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful deletion (200 status)

      // Check the response message
      expect(response.body).toEqual({
        message: expect.stringContaining(`Successfully deleted`), // Updated to reflect the actual message
      });

      // Verify that no teams exist in the database for the given roomId
      const remainingTeams = await dbConnection
        .collection('teams')
        .find({ roomId })
        .toArray();
      expect(remainingTeams).toEqual([]); // Ensure the teams collection is empty for the room
    });

    it('should return a message when no teams exist to delete', async () => {
      // Clear the teams collection to ensure no teams exist before deletion
      await dbConnection.collection('teams').deleteMany({});

      // Perform request to delete all teams when none exist
      const response = await request(httpServer)
        .delete(`/rooms/${roomId}/teams`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful deletion (200 status)

      // Check the response message
      expect(response.body).toEqual({
        message: expect.stringContaining(`No teams found in room ${roomId}.`), // Updated to reflect the actual message
      });

      // Verify that still no teams exist in the database for the given roomId
      const remainingTeams = await dbConnection
        .collection('teams')
        .find({ roomId })
        .toArray();
      expect(remainingTeams).toEqual([]); // Ensure the teams collection is empty for the room
    });
  });

  describe('DELETE /rooms/:roomId/teams/:teamId', () => {
    let teamId: Types.ObjectId; // Variable to hold the team ID

    beforeEach(async () => {
      // Clear the teams collection before each test
      await dbConnection.collection('teams').deleteMany({});

      // Insert a test team into the database to delete
      const testTeam = {
        ...createTeam,
        name: 'Team C',
        roomId: new Types.ObjectId(roomId),
        _id: new Types.ObjectId(), // Generate a new ObjectId for the team
      };

      // Insert the test team into the database
      const result = await dbConnection.collection('teams').insertOne(testTeam);
      teamId = result.insertedId; // Store the ID of the inserted team
    });

    it('should delete a team by ID successfully', async () => {
      // Perform request to delete the specific team by ID
      const response = await request(httpServer)
        .delete(`/rooms/${roomId}/teams/${teamId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful deletion (200 status)

      // Check that the response body is empty
      expect(response.body).toEqual({}); // No message returned, so expect an empty object

      // Verify that the team no longer exists in the database
      const deletedTeam = await dbConnection
        .collection('teams')
        .findOne({ _id: teamId });
      expect(deletedTeam).toBeNull(); // Ensure the team was deleted
    });

    it('should return 404 if team does not exist', async () => {
      // Generate a non-existent team ID
      const nonExistentTeamId = new Types.ObjectId();

      // Perform request to delete a non-existent team
      const response = await request(httpServer)
        .delete(`/rooms/${roomId}/teams/${nonExistentTeamId}`)
        .set('authorization', `Bearer ${authToken}`)
        .expect(404); // Expect a 404 status for a non-existent team

      // Check the response message for non-existence
      expect(response.body).toEqual({
        message: `Team ${nonExistentTeamId} in room ${roomId} not found`, // Match the not found message format
        error: 'Not Found', // Include error type if your controller includes this
        statusCode: 404, // Include status code if your controller includes this
      });
    });
  });

  describe('PUT /rooms/:roomId/teams/:teamId', () => {
    let teamId: Types.ObjectId; // Variable to hold the team ID
    const updateTeamDto = {
      // Sample update data
      name: 'Updated Team',
      players: [new Types.ObjectId().toString()], // Replace with actual player IDs as needed
      describer: new Types.ObjectId().toString(), // Replace with an actual user ID
      description: 'Updated description',
      teamLeader: new Types.ObjectId().toString(), // Replace with an actual user ID
      selectedWord: new Types.ObjectId().toString(), // Replace with an actual word ID
      tryedWords: [new Types.ObjectId().toString()], // Replace with actual word IDs as needed
      success: true,
      answer: 'Updated answer',
    };

    beforeEach(async () => {
      // Clear the teams collection before each test
      await dbConnection.collection('teams').deleteMany({});

      // Insert a test team into the database to update
      const testTeam = {
        ...createTeam,
        name: 'Team to Update',
        roomId: new Types.ObjectId(roomId),
        _id: new Types.ObjectId(), // Generate a new ObjectId for the team
      };

      // Insert the test team into the database
      const result = await dbConnection.collection('teams').insertOne(testTeam);
      teamId = result.insertedId; // Store the ID of the inserted team
    });

    it('should update a team by ID successfully', async () => {
      // Perform request to update the specific team by ID
      const response = await request(httpServer)
        .put(`/rooms/${roomId}/teams/${teamId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(updateTeamDto) // Send the update data
        .expect(200); // Expect a successful update (200 status)

      // Check that the response body contains the updated team
      expect(response.body).toMatchObject({
        _id: teamId.toString(), // Ensure the ID is a string
        ...updateTeamDto,
        roomId, // Ensure roomId is a string in the response
      });

      // Verify that the team has been updated in the database
      const updatedTeam = await dbConnection
        .collection('teams')
        .findOne({ _id: teamId });
      expect({ ...updatedTeam, roomId: roomId.toString() }).toMatchObject({
        ...updateTeamDto,
        roomId, // Ensure roomId is also a string in the database check
      });
    });
  });
});
