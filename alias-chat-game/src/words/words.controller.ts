import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { Word } from './schemas/word.schema';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ParseObjectIdPipe } from '../parse-id.pipe';

/**
 * Controller for handling word-related operations,
 * including creating, retrieving, updating, and deleting words.
 */
@Controller('words')
@UseGuards(AuthGuard)
export class WordsController {
  constructor(
    /** Service for handling business logic related to words. */
    private readonly wordsService: WordsService,
  ) {}

  /**
   * Creates a new word.
   * POST /api/v1/words
   * @param {CreateWordDto} createWordDto - Data for creating the word.
   * @returns {Promise<Word>} - The newly created word.
   */
  @Post()
  create(@Body() createWordDto: CreateWordDto): Promise<Word> {
    return this.wordsService.create(createWordDto);
  }

  /**
   * Retrieves all words.
   * GET /api/v1/words
   * @returns {Promise<Word[]>} - List of all words.
   */
  @Get()
  findAll(): Promise<Word[]> {
    return this.wordsService.findAll();
  }

  /**
   * Retrieves a specific word by ID.
   * GET /api/v1/words/:id
   * @param {Types.ObjectId} id - ID of the word to retrieve.
   * @returns {Promise<Word>} - The requested word.
   */
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<Word> {
    return this.wordsService.findOne(id);
  }

  /**
   * Updates a specific word by ID.
   * PATCH /api/v1/words/:id
   * @param {Types.ObjectId} id - ID of the word to update.
   * @param {UpdateWordDto} updateWordDto - Data for updating the word.
   * @returns {Promise<Word>} - The updated word.
   */
  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateWordDto: UpdateWordDto,
  ): Promise<Word> {
    return this.wordsService.update(id, updateWordDto);
  }

  /**
   * Deletes a specific word by ID.
   * DELETE /api/v1/words/:id
   * @param {Types.ObjectId} id - ID of the word to delete.
   * @returns {Promise<{ message: string }>} - Confirmation message on successful deletion.
   */
  @Delete(':id')
  remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<{ message: string }> {
    return this.wordsService.remove(id);
  }

  /**
   * Gets a random word for a team in a specific room.
   * POST /api/v1/words/random
   * Protected by AuthGuard to ensure the user is authenticated.
   * @param {Types.ObjectId} roomId - ID of the room.
   * @param {Types.ObjectId} teamId - ID of the team.
   * @param {any} request - Request object to extract user details (JWT payload).
   * @returns {Promise<{ word: Word; tryedWords: Types.ObjectId[] }>} - Random word and list of tried words.
   */
  @Post('random')
  async getRandomWord(
    @Body('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Body('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Req() request: any, // Get the request to access JWT payload
  ): Promise<{ word: Word; tryedWords: Types.ObjectId[] }> {
    return this.wordsService.getRandomWord(roomId, teamId, request.userId);
  }

  /**
   * Checks if the provided answer is correct for a given word.
   * POST /api/v1/words/:id/check-answer
   * @param {Types.ObjectId} wordId - ID of the word.
   * @param {string} answer - The user's answer to check.
   * @returns {Promise<{ correct: boolean }>} - Whether the answer is correct.
   */
  @Post(':id/check-answer')
  async checkAnswer(
    @Param('id', ParseObjectIdPipe) wordId: Types.ObjectId,
    @Body('answer') answer: string,
  ): Promise<{ correct: boolean }> {
    const isCorrect = await this.wordsService.checkAnswer(wordId, answer);
    return { correct: isCorrect };
  }

  /**
   * Checks if the provided description is correct for a given word.
   * POST /api/v1/words/:id/check-description
   * @param {Types.ObjectId} wordId - ID of the word.
   * @param {string} description - The user's description to check.
   * @returns {Promise<{ correct: boolean }>} - Whether the description is correct.
   */
  @Post(':id/check-description')
  async checkDescription(
    @Param('id', ParseObjectIdPipe) wordId: Types.ObjectId,
    @Body('description') description: string,
  ): Promise<{ correct: boolean }> {
    const isCorrect = await this.wordsService.checkDescription(
      wordId,
      description,
    );
    return { correct: isCorrect };
  }
}
