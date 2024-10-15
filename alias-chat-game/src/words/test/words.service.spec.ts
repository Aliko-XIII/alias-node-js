import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WordsService } from '../words.service';
import { Word } from '../schemas/word.schema';
import { Model, Types } from 'mongoose';
import { wordStub } from './stubs/word.stub';
import { TeamsService } from '../../teams/teams.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// npm test words.service

describe('WordsService', () => {
  let wordsService: WordsService;
  let wordModel: Model<Word>;
  let mockTeamsService: Partial<TeamsService>;

  beforeEach(async () => {
    mockTeamsService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        {
          provide: getModelToken(Word.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
        { provide: TeamsService, useValue: mockTeamsService },
      ],
    }).compile();

    wordsService = moduleRef.get<WordsService>(WordsService);
    wordModel = moduleRef.get<Model<Word>>(getModelToken(Word.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new word if it does not exist', async () => {
      wordModel.findOne = jest.fn().mockResolvedValue(null);

      const createdWord = wordStub();
      wordModel.create = jest.fn().mockResolvedValue(createdWord);

      const result = await wordsService.create({
        word: createdWord.word,
        similarWords: createdWord.similarWords,
      });

      expect(wordModel.findOne).toHaveBeenCalledWith({
        word: createdWord.word,
      });
      expect(wordModel.create).toHaveBeenCalledWith({
        word: createdWord.word,
        similarWords: createdWord.similarWords,
      });
      expect(result).toEqual(createdWord);
    });

    it('should throw ConflictException if word already exists', async () => {
      wordModel.findOne = jest.fn().mockResolvedValue(wordStub());

      await expect(
        wordsService.create({
          word: wordStub().word,
          similarWords: wordStub().similarWords,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of words', async () => {
      wordModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([wordStub()]),
      });

      const result = await wordsService.findAll();

      expect(wordModel.find).toHaveBeenCalled();
      expect(result).toEqual([wordStub()]);
    });
  });

  describe('findOne', () => {
    it('should return a word if it exists', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });

      const result = await wordsService.findOne(wordStub().wordId);

      expect(wordModel.findById).toHaveBeenCalledWith(wordStub().wordId);
      expect(result).toEqual(wordStub());
    });

    it('should throw NotFoundException if word does not exist', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wordsService.findOne(wordStub().wordId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a word successfully', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });

      wordModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });

      const result = await wordsService.update(wordStub().wordId, {
        word: 'updated word',
      });

      expect(wordModel.findById).toHaveBeenCalledWith(wordStub().wordId);
      expect(wordModel.findByIdAndUpdate).toHaveBeenCalledWith(
        wordStub().wordId,
        { word: 'updated word' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(wordStub());
    });

    it('should throw BadRequestException if no fields are provided for update', async () => {
      await expect(wordsService.update(wordStub().wordId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if word to update does not exist', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        wordsService.update(wordStub().wordId, { word: 'updated word' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a word successfully', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });

      wordModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await wordsService.remove(wordStub().wordId);

      expect(wordModel.findById).toHaveBeenCalledWith(wordStub().wordId);
      expect(wordModel.findByIdAndDelete).toHaveBeenCalledWith(
        wordStub().wordId,
      );
      expect(result).toEqual({ message: 'Word successfully deleted.' });
    });

    it('should throw NotFoundException if word to delete does not exist', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wordsService.remove(wordStub().wordId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById (private)', () => {
    it('should throw BadRequestException if wordId is invalid', async () => {
      await expect(
        wordsService['findById']('invalid' as unknown as Types.ObjectId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if word is not found', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wordsService['findById'](wordStub().wordId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a word if it exists', async () => {
      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });

      const result = await wordsService['findById'](wordStub().wordId);

      expect(result).toEqual(wordStub());
    });
  });

  describe('getRandomWord', () => {
    const roomId = new Types.ObjectId();
    const teamId = new Types.ObjectId();
    const userId = '507f1f77bcf86cd799439011'; // 24 character hex string

    const teamStub = {
      describer: userId,
      tryedWords: ['6706a8523b7069a52a3594ba'],
      selectedWord: null,
    };

    it('should throw NotFoundException if no unused words are available', async () => {
      mockTeamsService.findOne = jest.fn().mockResolvedValue(teamStub);
      wordModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(
        wordsService.getRandomWord(roomId, teamId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockTeamsService.findOne).toHaveBeenCalledWith(roomId, teamId);
      expect(wordModel.find).toHaveBeenCalledWith({
        _id: { $nin: teamStub.tryedWords },
      });
    });

    it('should throw UnauthorizedException if the user is not the describer', async () => {
      mockTeamsService.findOne = jest.fn().mockResolvedValue({
        ...teamStub,
        describer: 'anotherUser',
      });

      await expect(
        wordsService.getRandomWord(roomId, teamId, userId),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockTeamsService.findOne).toHaveBeenCalledWith(roomId, teamId);
    });

    it('should throw NotFoundException if the team is not found', async () => {
      mockTeamsService.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        wordsService.getRandomWord(roomId, teamId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockTeamsService.findOne).toHaveBeenCalledWith(roomId, teamId);
    });
  });

  describe('checkAnswer', () => {
    it('should return true if the answer matches the word or similar words', async () => {
      const wordId = wordStub().wordId;
      const answer = 'bicycles';

      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });
      const result = await wordsService.checkAnswer(wordId, answer);

      expect(result).toBe(true);
    });

    it('should return false if the answer does not match the word or similar words', async () => {
      const wordId = wordStub().wordId;
      const answer = 'wrongAnswer';

      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });
      const result = await wordsService.checkAnswer(wordId, answer);

      expect(result).toBe(false);
    });
  });

  describe('checkDescription', () => {
    it('should return false if the description contains the word or similar words', async () => {
      const wordId = wordStub().wordId;
      const description = 'This is a bicycle that you pedal to move.';

      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });
      const result = await wordsService.checkDescription(wordId, description);

      expect(result).toBe(false);
    });

    it('should return true if the description does not contain the word or similar words', async () => {
      const wordId = wordStub().wordId;
      const description =
        'This is a mode of transportation that you pedal to move.';

      wordModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(wordStub()),
      });
      const result = await wordsService.checkDescription(wordId, description);

      expect(result).toBe(true);
    });
  });
});
