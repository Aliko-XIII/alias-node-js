import { Test, TestingModule } from '@nestjs/testing';
import { WordsController } from '../words.controller';
import { WordsService } from '../words.service';
import { wordStub } from './../test/stubs/word.stub';
import { Word } from '../schemas/word.schema';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UpdateWordDto } from '../dto/update-word.dto';
import { CreateWordDto } from '../dto/create-word.dto';
import { Types } from 'mongoose';
import { mockAuthGuard } from '../__mocks__/words-auth.guard.mock';

// Mocking WordsService to isolate tests
jest.mock('../words.service');

describe('WordsController', () => {
  let wordsController: WordsController;
  let wordsService: WordsService;

  // Setting up the testing module
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [WordsController],
      providers: [WordsService],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    wordsController = moduleRef.get<WordsController>(WordsController);
    wordsService = moduleRef.get<WordsService>(WordsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    describe('when findOne is called', () => {
      let word: Word;

      beforeEach(async () => {
        word = await wordsController.findOne(wordStub().wordId);
      });

      test('then it should call wordsService.findOne', () => {
        expect(wordsService.findOne).toHaveBeenCalledWith(wordStub().wordId);
      });

      test('then it should return a word', () => {
        expect(word).toEqual(wordStub());
      });
    });
  });

  describe('create', () => {
    describe('when create is called', () => {
      let word: Word;
      let createWordDto: CreateWordDto;

      beforeEach(async () => {
        createWordDto = {
          word: wordStub().word,
          similarWords: wordStub().similarWords,
        };
        word = await wordsController.create(createWordDto);
      });

      test('then it should call wordsService.create', () => {
        expect(wordsService.create).toHaveBeenCalledWith(createWordDto);
      });

      test('then it should return a word', () => {
        expect(word).toEqual(wordStub());
      });
    });
  });

  describe('findAll', () => {
    describe('when findAll is called', () => {
      let words: Word[];

      beforeEach(async () => {
        words = await wordsController.findAll();
      });

      test('then it should call wordsService.findAll', () => {
        expect(wordsService.findAll).toHaveBeenCalled();
      });

      test('then it should return an array of words', () => {
        expect(words).toEqual([wordStub()]);
      });
    });
  });

  describe('update', () => {
    describe('when update is called', () => {
      let word: Word;
      let updateWordDto: UpdateWordDto;

      beforeEach(async () => {
        updateWordDto = {
          word: 'updated',
          similarWords: ['updated1', 'updated2'],
        };
        word = await wordsController.update(wordStub().wordId, updateWordDto);
      });

      test('then it should call wordsService.update', () => {
        expect(wordsService.update).toHaveBeenCalledWith(
          wordStub().wordId,
          updateWordDto,
        );
      });

      test('then it should return the updated word', () => {
        expect(word).toEqual(wordStub());
      });
    });
  });

  describe('remove', () => {
    describe('when remove is called', () => {
      let message: { message: string };

      beforeEach(async () => {
        message = await wordsController.remove(wordStub().wordId);
      });

      test('then it should call wordsService.remove', () => {
        expect(wordsService.remove).toHaveBeenCalledWith(wordStub().wordId);
      });

      test('then it should return success message', () => {
        expect(message).toEqual({ message: 'Word successfully deleted.' });
      });
    });
  });

  describe('checkAnswer', () => {
    describe('when checkAnswer is called', () => {
      let response: { correct: boolean };
      const wordId = wordStub().wordId;
      const answer = 'someAnswer';

      beforeEach(async () => {
        wordsService.checkAnswer = jest.fn().mockResolvedValue(true); // Mocking the service method
        response = await wordsController.checkAnswer(wordId, answer);
      });

      test('then it should call wordsService.checkAnswer', () => {
        expect(wordsService.checkAnswer).toHaveBeenCalledWith(wordId, answer);
      });

      test('then it should return correct answer status', () => {
        expect(response).toEqual({ correct: true });
      });
    });
  });

  describe('checkDescription', () => {
    describe('when checkDescription is called', () => {
      let response: { correct: boolean };
      const wordId = wordStub().wordId;
      const description = 'some description';

      beforeEach(async () => {
        wordsService.checkDescription = jest.fn().mockResolvedValue(false); // Mocking the service method
        response = await wordsController.checkDescription(wordId, description);
      });

      test('then it should call wordsService.checkDescription', () => {
        expect(wordsService.checkDescription).toHaveBeenCalledWith(
          wordId,
          description,
        );
      });

      test('then it should return correct description status', () => {
        expect(response).toEqual({ correct: false });
      });
    });
  });

  describe('getRandomWord', () => {
    describe('when getRandomWord is called', () => {
      let roomId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let request: any;
      let response: { word: Word; tryedWords: Types.ObjectId[] };

      beforeEach(async () => {
        roomId = new Types.ObjectId();
        teamId = new Types.ObjectId();
        request = { userId: 'someUserId' };

        // Mock the service method response
        wordsService.getRandomWord = jest.fn().mockResolvedValue({
          word: wordStub(),
          tryedWords: [],
        });

        response = await wordsController.getRandomWord(roomId, teamId, request);
      });

      test('then it should call wordsService.getRandomWord', () => {
        expect(wordsService.getRandomWord).toHaveBeenCalledWith(
          roomId,
          teamId,
          request.userId,
        );
      });

      test('then it should return a random word and tried words', () => {
        expect(response).toEqual({
          word: wordStub(),
          tryedWords: [],
        });
      });
    });
  });
});
