import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Word, WordDocument } from './schemas/word.schema';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import * as levenshtein from 'fast-levenshtein';
import * as natural from 'natural';
import { TeamsService } from '../teams/teams.service';
import { UpdateTeamDto } from '../teams/dto/update-team.dto';

@Injectable()
export class WordsService {
  constructor(
    @InjectModel(Word.name) private wordModel: Model<WordDocument>,
    private teamsService: TeamsService,
  ) {}

  /**
   * Creates a new word in the database.
   *
   * @param createWordDto - The data transfer object containing word details.
   * @returns The created word document.
   * @throws ConflictException if the word already exists.
   */
  async create(createWordDto: CreateWordDto): Promise<WordDocument> {
    const existingWord = await this.wordModel.findOne({
      word: createWordDto.word,
    });

    if (existingWord) {
      throw new ConflictException(
        `Word '${createWordDto.word}' already exists.`,
      );
    }

    const createdWord = await this.wordModel.create(createWordDto);
    return createdWord;
  }

  /**
   * Retrieves all words from the database.
   *
   * @returns An array of word documents.
   */
  async findAll(): Promise<WordDocument[]> {
    return this.wordModel.find().exec();
  }

  /**
   * Retrieves a word by its ID.
   *
   * @param wordId - The ID of the word to retrieve.
   * @returns The word document.
   */
  async findOne(wordId: Types.ObjectId): Promise<WordDocument> {
    return this.findById(wordId);
  }

  /**
   * Updates a word by its ID.
   *
   * @param wordId - The ID of the word to update.
   * @param updateWordDto - The data transfer object containing updated word details.
   * @returns The updated word document.
   * @throws BadRequestException if no fields are provided for update.
   */
  async update(
    wordId: Types.ObjectId,
    updateWordDto: UpdateWordDto,
  ): Promise<WordDocument> {
    if (Object.keys(updateWordDto).length === 0) {
      throw new BadRequestException('At least one field must be updated.');
    }

    await this.findById(wordId);
    return this.wordModel
      .findByIdAndUpdate(wordId, updateWordDto, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  /**
   * Deletes a word by its ID.
   *
   * @param wordId - The ID of the word to delete.
   * @returns A confirmation message.
   */
  async remove(wordId: Types.ObjectId): Promise<{ message: string }> {
    await this.findById(wordId);
    await this.wordModel.findByIdAndDelete(wordId).exec();
    return { message: 'Word successfully deleted.' };
  }

  /**
   * Finds a word by its ID and throws exceptions if not found or invalid.
   *
   * @param wordId - The ID of the word to find.
   * @returns The found word document.
   * @throws BadRequestException if the ID format is invalid.
   * @throws NotFoundException if the word is not found.
   */
  private async findById(wordId: Types.ObjectId): Promise<WordDocument> {
    if (!Types.ObjectId.isValid(wordId)) {
      throw new BadRequestException('Invalid word ID format.');
    }

    const word = await this.wordModel.findById(wordId).exec();
    if (!word) {
      throw new NotFoundException(`Word with ID '${wordId}' not found.`);
    }

    return word;
  }

  /**
   * Retrieves a random word that has not been tried yet by the describer.
   *
   * @param roomId - The ID of the room where the team is located.
   * @param teamId - The ID of the team requesting a new word.
   * @param userId - The ID of the user requesting the word, used to verify if they are the describer.
   * @returns A promise that resolves to an object containing a random word and the updated list of tried words.
   * @throws NotFoundException if the team is not found or no unused words are available.
   * @throws UnauthorizedException if the user is not the describer of the team.
   */
  async getRandomWord(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
    userId: string,
  ): Promise<{ word: WordDocument; tryedWords: Types.ObjectId[] }> {
    const team = await this.teamsService.findOne(roomId, teamId);
    const userObjectId = new Types.ObjectId(userId);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Verify if the requesting user is the describer of the team
    if (team.describer.toString() !== userObjectId.toString()) {
      throw new UnauthorizedException('Only the describer can get a new word.');
    }

    // Check if a word has already been selected
    if (team.selectedWord) {
      const selectedWord = await this.wordModel
        .findById(team.selectedWord)
        .exec();

      // Return the already selected word and the existing triedWords array
      return {
        word: selectedWord,
        tryedWords: team.tryedWords,
      };
    }

    const tryedWords = team.tryedWords;
    const unusedWords = await this.wordModel
      .find({
        _id: { $nin: tryedWords },
      })
      .exec();

    // If there are no unused words available, throw a NotFoundException
    if (unusedWords.length === 0) {
      throw new NotFoundException('No unused words found.');
    }

    // Select a random word from the list of unused words
    const randomIndex = Math.floor(Math.random() * unusedWords.length);
    const randomWord = unusedWords[randomIndex];

    tryedWords.push(randomWord._id);

    const updateTeamDto: UpdateTeamDto = {
      selectedWord: randomWord._id,
      tryedWords: tryedWords,
    };

    await this.teamsService.update(teamId, updateTeamDto);

    return {
      word: randomWord,
      tryedWords,
    };
  }

  /**
   * Checks if the provided answer matches the word or any of its similar words.
   *
   * @param wordId - The ObjectId of the word to check against.
   * @param answer - The answer string to be validated.
   * @returns A promise that resolves to a boolean indicating if the answer is correct.
   */
  async checkAnswer(wordId: Types.ObjectId, answer: string): Promise<boolean> {
    const wordDocument = await this.findById(wordId);

    const isCorrect = await this.compareWords(wordDocument.word, answer);
    if (isCorrect) return true;

    // Compare the answer with each of the similar words
    for (const similarWord of wordDocument.similarWords) {
      const isSimilar = await this.compareWords(similarWord, answer);
      if (isSimilar) return true;
    }

    return false;
  }

  /**
   * Checks if the description does not contain the word or any of its similar words.
   *
   * @param wordId - The ObjectId of the word to be checked.
   * @param description - The description string to be validated.
   * @returns A promise that resolves to a boolean indicating if the description is valid
   *          (i.e., contains no matching words or disguised versions of them).
   */
  async checkDescription(
    wordId: Types.ObjectId,
    description: string,
  ): Promise<boolean> {
    const wordDocument = await this.findById(wordId);

    // Get the word and its similar words for comparison.
    const wordsToCompareWith = [
      wordDocument.word,
      ...wordDocument.similarWords,
    ];

    // Sanitize the description:
    const sanitizedDescription = description
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove non-alphabet characters (except spaces)
      .replace(/\s+/g, ' ') // Normalize multiple spaces to one space
      .trim();

    // Generate a "collapsed" version of the description (no spaces between letters or words).
    const collapsedDescription = sanitizedDescription.replace(/\s+/g, '');

    // Split the sanitized description into individual words.
    const descriptionWords = sanitizedDescription.split(' ');

    // Check if the description contains exact matches or disguised versions of the words.
    for (const word of wordsToCompareWith) {
      const normalizedWord = word.toLowerCase();

      // Check collapsed description for hidden word (e.g., "c a t" -> "cat")
      if (collapsedDescription.includes(normalizedWord)) {
        return false;
      }

      // Check individual words in the sanitized description
      for (const descWord of descriptionWords) {
        const isExactMatch = await this.compareWords(normalizedWord, descWord);
        const isSubstringMatch = descWord.includes(normalizedWord);

        if (isExactMatch || isSubstringMatch) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Compares two words for similarity based on exact match, stemming, and Levenshtein distance.
   *
   * @param word1 - The first word to compare.
   * @param word2 - The second word to compare.
   * @returns A promise that resolves to a boolean indicating if the words are considered similar.
   */
  private async compareWords(word1: string, word2: string): Promise<boolean> {
    const wordToCheck1 = word1.toLowerCase().trim();
    const wordToCheck2 = word2.toLowerCase().trim();

    // Check for exact match
    if (wordToCheck1 === wordToCheck2) return true;

    // Perform stemming and compare
    const stemmer = natural.PorterStemmer;
    const stemmedWord1 = stemmer.stem(wordToCheck1);
    const stemmedWord2 = stemmer.stem(wordToCheck2);
    if (stemmedWord1 === stemmedWord2) return true;

    // Check for similarity using Levenshtein distance
    const distance = levenshtein.get(wordToCheck1, wordToCheck2);
    const maxLength = Math.max(wordToCheck1.length, wordToCheck2.length);
    const similarityThreshold = 0.2;

    return distance / maxLength <= similarityThreshold;
  }
}
