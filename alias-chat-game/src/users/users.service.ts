import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserSafeDto } from './dto/user-safe.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ArchivedUserDocument,
  ArchivedUser,
} from './schemas/archived-user.schema';

// UsersService responsible for handling user-related operations.
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ArchivedUser.name)
    private archivedUserModel: Model<ArchivedUserDocument>,
  ) {}

  /**
   * Create a new client
   * @param {CreateUserDto} createUserDto - The DTO containing user creation data
   * @returns {Promise<User>} - A promise that resolves to the created User object
   * @throws {ConflictException} - If the username is already in use
   * @throws {InternalServerErrorException} - If an error occurs during the database operation
   */
  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ userId: string; user: User }> {
    const { username, password } = createUserDto;

    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new ConflictException('Username already in use.');
    }

    const hashedPassword = await this.hashPassword(password);

    // const newUser = new this.userModel({ username, hashedPassword });
    // const savedUser = await newUser.save();
    const savedUser = await this.userModel.create({
      username,
      hashedPassword,
    });
    return { userId: savedUser._id.toString(), user: savedUser };
  }

  /**
   * Retrieves all users and maps them to a safe DTO format.
   * @returns {Promise<UserSafeDto[]>} - A promise that resolves to an array of UserSafeDto objects.
   * @throws {InternalServerErrorException} - If an error occurs during the database operation.
   */
  async getUsers(): Promise<UserSafeDto[]> {
    try {
      const users = await this.userModel.find().exec();

      return users.map((user) => this.mapToSafeDto(user));
    } catch {
      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving the user list.',
      );
    }
  }

  /**
   * Retrieves a user by ID and maps them to a safe DTO format.
   * @param {Types.ObjectId} userId - The ID of the user to retrieve.
   * @returns {Promise<UserSafeDto>} - A promise that resolves to the UserSafeDto.
   * @throws {NotFoundException} - If no user is found with the given ID.
   * @throws {InternalServerErrorException} - If an unexpected error occurs during the database operation.
   */
  async getUserById(userId: Types.ObjectId): Promise<UserSafeDto> {
    try {
      const user = await this.findUserById(userId);
      return this.mapToSafeDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving the user.',
      );
    }
  }

  /**
   * Update the user's information.
   * @param {Types.ObjectId} userId - The ID of the user to update.
   * @param {UpdateUserDto} updateUserDto - The DTO containing the fields to update.
   * @returns {Promise<UserSafeDto>} - A promise that resolves to the updated user's safe DTO.
   * @throws {NotFoundException} - If the user is not found.
   * @throws {BadRequestException} - If no valid fields are provided for update.
   * @throws {ConflictException} - If the new username is already in use.
   * @throws {InternalServerErrorException} - If an unexpected error occurs during the database operation.
   */
  async updateUser(userId: Types.ObjectId, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findUserById(userId);

      this.validateUpdateFields(updateUserDto);
      await this.checkUsernameAvailability(updateUserDto.username, userId);

      if (updateUserDto.username) {
        user.username = updateUserDto.username;
      }
      if (updateUserDto.password) {
        user.hashedPassword = await this.hashPassword(updateUserDto.password);
      }

      const updatedUser = await user.save();
      return this.mapToSafeDto(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating the user.',
      );
    }
  }

  /**
   * Removes a user from the database, either by hard deletion or soft deletion (archiving)
   * @param {Types.ObjectId} userId - The ID of the user to remove.
   * @param {boolean} isHardDelete - Flag to determine whether to perform a hard delete or soft delete.
   * @returns {Promise<{ message: string }>} - A promise that resolves to an object containing a success message.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async removeUser(userId: Types.ObjectId, isHardDelete: boolean) {
    const user = await this.findUserById(userId);

    if (isHardDelete) {
      // Perform a hard delete
      await this.userModel.deleteOne({ _id: userId });
      return { message: 'User account permanently deleted.' };
    }

    // Perform a soft delete
    await this.archivedUserModel.create({
      ...user.toObject(),
      deletedAt: new Date(),
    });

    await this.userModel.deleteOne({ _id: userId });
    return {
      message: 'User account soft deleted and moved to archive successfully.',
    };
  }

  /**
   * Maps a UserDocument to a UserSafeDto.
   * @param {UserDocument} user - The user document to map.
   * @returns {UserSafeDto} - The mapped UserSafeDto.
   */
  private mapToSafeDto(user: UserDocument): UserSafeDto {
    return {
      userId: user._id.toString(),
      username: user.username,
      score: user.score,
      played: user.played,
      wins: user.wins,
    };
  }

  /**
   * Finds a user by their ID in the database.
   * @param {Types.ObjectId} userId - The ID of the user to retrieve.
   * @returns {Promise<UserDocument>} - A promise that resolves to the UserDocument.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  private async findUserById(userId: Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  /**
   * Validates the update fields provided in the DTO.
   * @param {UpdateUserDto} updateUserDto - The DTO containing the fields to update.
   * @throws {BadRequestException} - If neither username nor password is provided.
   */
  private validateUpdateFields(updateUserDto: UpdateUserDto): void {
    if (!updateUserDto.username && !updateUserDto.password) {
      throw new BadRequestException(
        'At least one field (username or password) is required for update.',
      );
    }
  }

  /**
   * Checks if the new username is available for use.
   * @param {string | undefined} newUsername - The new username to check for availability.
   * @param {Types.ObjectId} currentUserId - The ID of the current user (to allow keeping the same username).
   * @throws {ConflictException} - If the new username is already in use by another user.
   */
  private async checkUsernameAvailability(
    newUsername: string | undefined,
    currentUserId: Types.ObjectId,
  ): Promise<void> {
    if (newUsername) {
      const existingUser = await this.userModel
        .findOne({ username: newUsername })
        .exec();
      if (existingUser && !existingUser._id.equals(currentUserId)) {
        throw new ConflictException('Username already in use.');
      }
    }
  }

  /**
   * Generates a bcrypt hash of the provided password.
   * @param {string} password - The plain text password to hash.
   * @returns {Promise<string>} - A promise that resolves to the hashed password using bcrypt.
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a bcrypt-hashed password.
   * @param {string} password - The plain text password to compare.
   * @param {string} hashedPassword - The previously hashed password for comparison.
   * @returns {Promise<boolean>} - A promise that resolves to true if passwords match, otherwise false.
   */
  private async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Validates user credentials.
   * @param {string} username - The username of the user attempting to authenticate.
   * @param {string} password - The plain text password to validate against the stored hash.
   * @returns {Promise<UserSafeDto>} - A promise that resolves to the updated user's safe DTO.
   * @throws {NotFoundException} - If no user is found with the given username.
   * @throws {BadRequestException} - If the provided password is invalid.
   */
  public async checkAuth(
    username: string,
    password: string,
  ): Promise<UserSafeDto> {
    const user = await this.userModel.findOne({ username }).exec();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password.');
    }

    return this.mapToSafeDto(user);
  }

  async incrementScore(userId: Types.ObjectId, score: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $inc: { score: score } });
  }
}
