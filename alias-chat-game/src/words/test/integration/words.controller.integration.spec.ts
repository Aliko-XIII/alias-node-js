import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { Connection, Types } from 'mongoose';
import request from 'supertest';
import { DatabaseService } from '../../../database/database.service';
import { createWordStub } from '../stubs/create-word.stub';
import { createWordsStub } from '../stubs/create-words.stub';
import { updateWordStub } from '../stubs/update-word.stub';

describe('WordsController (integration)', () => {
  const createWord = createWordStub();
  const updateWord = updateWordStub();
  const words = createWordsStub();
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
        username: 'TestUser1',
        password: 'testPass-123',
      })
      .expect(201);

    // Authenticate and get a token
    const authResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        username: 'TestUser1',
        password: 'testPass-123',
      })
      .expect(201);

    authToken = JSON.parse(authResponse.text).data.access_token;
  });

  afterAll(async () => {
    await dbConnection.collection('users').deleteMany({});
    await app.close(); // Close the app after all tests
  });

  beforeEach(async () => {
    // Clear the words collection before each test
    await dbConnection.collection('words').deleteMany({});
    await dbConnection.collection('users').deleteMany({});
  });

  describe('POST /words', () => {
    it('should create a new word successfully', async () => {
      const response = await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(201); // Expect a successful creation (201 status)

      expect(response.body).toMatchObject(createWord); // Check response matches created word

      const createdWord = await dbConnection
        .collection('words')
        .findOne({ word: createWord.word });
      expect(createdWord).toBeTruthy(); // Ensure the word is saved in the database
    });

    it('should return 409 Conflict if the word already exists', async () => {
      await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(201);

      // Attempt to create a duplicate
      const response = await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(409);

      expect(response.body.message).toEqual(
        `Word '${createWord.word}' already exists.`, // Check for correct error message
      );
    });
  });

  describe('GET /words/:wordId', () => {
    it('should return a word successfully by wordId', async () => {
      // Create a test word
      const createResponse = await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(201);

      const createdWordId = createResponse.body._id; // Store the ID of the created word

      // Perform request to get the word by its ID
      const response = await request(httpServer)
        .get(`/words/${createdWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful retrieval (200 status)

      expect(response.body).toMatchObject(createWord); // Check that the retrieved word matches the created word
    });

    it('should return 404 if the word does not exist', async () => {
      const nonExistentWordId = new Types.ObjectId().toHexString();

      // Perform request with a non-existent ID
      const response = await request(httpServer)
        .get(`/words/${nonExistentWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(404); // Expect not found (404 status)

      expect(response.body.message).toEqual(
        `Word with ID '${nonExistentWordId}' not found.`, // Check for correct error message
      );
    });
  });

  describe('GET /words', () => {
    it('should return an array of words successfully', async () => {
      // Insert test words into the database
      await dbConnection.collection('words').insertMany(words);

      // Perform request to get all words
      const response = await request(httpServer)
        .get('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful retrieval (200 status)

      // Convert the _id fields to strings in the response and expected words
      const wordsWithStringIds = response.body.map((word: any) => ({
        ...word,
        _id: word._id.toString(), // Convert ObjectId to string
      }));

      const expectedWords = words.map((word) => ({
        ...word,
        _id: expect.any(String), // Expect any string as _id
      }));

      // Check that the returned array contains the created words
      expect(wordsWithStringIds).toEqual(expect.arrayContaining(expectedWords));
    });

    it('should return an empty array if no words exist', async () => {
      // Remove all records from the collection before the test
      await dbConnection.collection('words').deleteMany({});

      // Perform request to get all words
      const response = await request(httpServer)
        .get('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful retrieval (200 status)

      expect(response.body).toEqual([]); // Check that an empty array is returned
    });
  });

  describe('PATCH /words/:wordId', () => {
    it('should update a word successfully', async () => {
      // Create a test word
      const createResponse = await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(201);

      const createdWordId = createResponse.body._id; // Store the ID of the created word

      const updateResponse = await request(httpServer)
        .patch(`/words/${createdWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(updateWord)
        .expect(200); // Expect successful update (200 status)

      expect(updateResponse.body).toMatchObject(updateWord); // Check that the updated word is correctly returned

      // Check that the word is updated in the database
      const updatedWord = await dbConnection
        .collection('words')
        .findOne({ _id: new Types.ObjectId(createdWordId) });

      expect(updatedWord).toMatchObject(updateWord); // Verify the updated word in the database
    });

    it('should return 404 if the word does not exist', async () => {
      const nonExistentWordId = new Types.ObjectId().toHexString();

      const updateWordDto = {
        word: 'nonExistentWord',
        similarWords: ['none'],
      };

      // Attempt to update a non-existent word
      const response = await request(httpServer)
        .patch(`/words/${nonExistentWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(updateWordDto)
        .expect(404); // Expect not found (404 status)

      expect(response.body.message).toEqual(
        `Word with ID '${nonExistentWordId}' not found.`, // Check for correct error message
      );
    });
  });

  describe('DELETE /words/:wordId', () => {
    it('should remove a word successfully', async () => {
      // Create a test word
      const createResponse = await request(httpServer)
        .post('/words')
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .send(createWord)
        .expect(201);

      const createdWordId = createResponse.body._id; // Store the ID of the created word

      // Delete the word
      const deleteResponse = await request(httpServer)
        .delete(`/words/${createdWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(200); // Expect successful deletion (200 status)

      expect(deleteResponse.body).toEqual({
        message: 'Word successfully deleted.', // Check for correct deletion message
      });

      // Verify that the word is no longer in the database
      const deletedWord = await dbConnection
        .collection('words')
        .findOne({ _id: new Types.ObjectId(createdWordId) });

      expect(deletedWord).toBeNull(); // Ensure the word has been deleted
    });

    it('should return 404 if the word does not exist', async () => {
      const nonExistentWordId = new Types.ObjectId().toHexString();

      // Attempt to delete a non-existent word
      const response = await request(httpServer)
        .delete(`/words/${nonExistentWordId}`)
        .set('authorization', `Bearer ${authToken}`) // Set the authorization header
        .expect(404); // Expect not found (404 status)

      expect(response.body.message).toEqual(
        `Word with ID '${nonExistentWordId}' not found.`, // Check for correct error message
      );
    });
  });
});
