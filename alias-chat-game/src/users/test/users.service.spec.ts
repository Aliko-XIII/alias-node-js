import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../users.service';
import { Model, Types } from 'mongoose';
import { ArchivedUser } from '../schemas/archived-user.schema';
import { createUserStub, createDbUserStub } from './stubs/create-user.stub';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { mockAuthGuard } from '../__mocks__/users-auth.guard.mock';

describe('UsersService (Unit)', () => {
  let usersService: UsersService;
  let userModel: Model<User>;
  let archivedUserModel: Model<ArchivedUser>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(ArchivedUser.name),
          useValue: {
            create: jest.fn().mockImplementation((archivedUser) => {
              return {
                ...archivedUser,
                save: jest.fn().mockResolvedValue(archivedUser),
              };
            }),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
    archivedUserModel = moduleRef.get<Model<ArchivedUser>>(
      getModelToken(ArchivedUser.name),
    );

    jest
      .spyOn(usersService as any, 'hashPassword')
      .mockResolvedValue(
        '$2b$10$sTwo3ikfhwswHJ6nRXAU1Ocm42E1VWJIA2o.aUnaFuIyJ1xRgmEO.',
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user if it does not exist', async () => {
      const createdUser = createUserStub();
      const dbUser = createDbUserStub();
      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      userModel.create = jest.fn().mockResolvedValue(dbUser);

      const result = await usersService.createUser(createdUser);

      expect(userModel.findOne).toHaveBeenCalledWith({
        username: createdUser.username,
      });
      expect(usersService['hashPassword']).toHaveBeenCalledWith(
        createdUser.password,
      );
      expect(userModel.create).toHaveBeenCalledWith({
        username: createdUser.username,
        hashedPassword: dbUser.hashedPassword,
      });
      expect(result).toEqual({
        userId: '66f8f7fb027b5bb2be6d0dd9',
        user: dbUser,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const createdUser = createUserStub();
      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(createDbUserStub()),
      });

      await expect(usersService.createUser(createdUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUsers', () => {
    it('should return a list of users from the database', async () => {
      const dbUser = createDbUserStub();
      userModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([dbUser]),
      });

      const result = await usersService.getUsers();

      expect(userModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        expect.objectContaining({ username: dbUser.username }),
      ]);
    });

    it('should return an empty array when no users are found', async () => {
      userModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await usersService.getUsers();

      expect(userModel.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException if a general error occurs', async () => {
      userModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(usersService.getUsers()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserById', () => {
    const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');

    it('should return a user when found', async () => {
      const dbUser = createDbUserStub();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(dbUser),
      });

      const result = await usersService.getUserById(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(
        expect.objectContaining({ username: dbUser.username }),
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(usersService.getUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if a general error occurs', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(usersService.getUserById(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateUser', () => {
    const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');
    const updateUserDto: UpdateUserDto = {
      username: 'newUsername',
      password: 'newPassword',
    };

    it('should update the user successfully', async () => {
      const dbUser = { ...createDbUserStub(), save: jest.fn() };
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(dbUser),
      });
      dbUser.save.mockResolvedValue({
        ...dbUser,
        username: 'newUsername',
        hashedPassword: 'hashedPassword',
      });

      const result = await usersService.updateUser(userId, updateUserDto);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(usersService['hashPassword']).toHaveBeenCalledWith('newPassword');
      expect(dbUser.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ username: 'newUsername' }),
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        usersService.updateUser(userId, updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when a general error occurs', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        usersService.updateUser(userId, updateUserDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeUser', () => {
    const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');

    beforeEach(() => {
      const dbUser = createDbUserStub();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...dbUser,
          toObject: jest.fn().mockReturnValue(dbUser),
        }),
      });
      userModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      archivedUserModel.create = jest.fn().mockResolvedValue({});
    });

    it('should perform a hard delete successfully', async () => {
      const result = await usersService.removeUser(userId, true);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual({ message: 'User account permanently deleted.' });
    });

    it('should perform a soft delete successfully', async () => {
      const result = await usersService.removeUser(userId, false);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(archivedUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDbUserStub(),
          deletedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({
        message: 'User account soft deleted and moved to archive successfully.',
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(usersService.removeUser(userId, false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.removeUser(userId, true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create an archived user on soft delete', async () => {
      await usersService.removeUser(userId, false);

      expect(archivedUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDbUserStub(),
          deletedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('addGameResult', () => {
    const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');

    beforeEach(() => {
      const dbUser = {
        ...createDbUserStub(),
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(dbUser),
      });
    });

    it('should update user stats for a win', async () => {
      const result = await usersService.addGameResult(userId, true);

      const dbUser = await userModel.findById(userId).exec();
      expect(dbUser.played).toBe(1);
      expect(dbUser.wins).toBe(1);
      expect(dbUser.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          played: 1,
          wins: 1,
        }),
      );
    });

    it('should update user stats for a loss', async () => {
      const result = await usersService.addGameResult(userId, false);

      const dbUser = await userModel.findById(userId).exec();
      expect(dbUser.played).toBe(1);
      expect(dbUser.wins).toBe(0);
      expect(dbUser.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          played: 1,
          wins: 0,
        }),
      );
    });
  });

  describe('mapToSafeDto', () => {
    it('should correctly map a UserDocument to a UserSafeDto', () => {
      const dbUser = createDbUserStub();

      const result = (usersService as any).mapToSafeDto(dbUser);

      expect(result).not.toHaveProperty('hashedPassword');
    });

    it('should convert user _id to string', () => {
      const dbUser = createDbUserStub();

      const result = (usersService as any).mapToSafeDto(dbUser);

      expect(typeof result.userId).toBe('string');
    });
  });

  describe('findUserById', () => {
    const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');

    it('should return a user when found', async () => {
      const dbUser = createDbUserStub();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(dbUser),
      });

      const result = await (usersService as any).findUserById(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(dbUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect((usersService as any).findUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect((usersService as any).findUserById(userId)).rejects.toThrow(
        'User not found.',
      );
    });
  });

  describe('validateUpdateFields', () => {
    it('should throw BadRequestException when both username and password are missing', () => {
      const updateUserDto = { username: '', password: '' };

      expect(() =>
        (usersService as any).validateUpdateFields(updateUserDto),
      ).toThrow(BadRequestException);
      expect(() =>
        (usersService as any).validateUpdateFields(updateUserDto),
      ).toThrow(
        'At least one field (username or password) is required for update.',
      );
    });

    it('should not throw an exception when both username and password are provided', () => {
      const updateUserDto = { username: 'newUser', password: 'newPassword' };

      expect(() =>
        (usersService as any).validateUpdateFields(updateUserDto),
      ).not.toThrow();
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should not throw an exception when the username is available', async () => {
      const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');

      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        (usersService as any).checkUsernameAvailability('newUser', userId),
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException when the username is already taken by another user', async () => {
      const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');
      const existingUserId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd1');

      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUserId),
      });

      await expect(
        (usersService as any).checkUsernameAvailability('newUser', userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('hashPassword', () => {
    it('should hash the password correctly', async () => {
      jest.spyOn(usersService as any, 'hashPassword').mockRestore();
      const password = 'plainPassword';

      const hashedPassword = await (usersService as any).hashPassword(password);

      expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
    });

    it('should generate a new hash even when the same password is provided', async () => {
      jest.spyOn(usersService as any, 'hashPassword').mockRestore();
      const password = 'plainPassword';

      const hashedPassword1 = await (usersService as any).hashPassword(
        password,
      );
      const hashedPassword2 = await (usersService as any).hashPassword(
        password,
      );

      expect(hashedPassword1).not.toEqual(hashedPassword2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true when passwords match', async () => {
      jest.spyOn(usersService as any, 'hashPassword').mockRestore();
      const password = 'plainPassword';
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await (usersService as any).comparePasswords(
        password,
        hashedPassword,
      );

      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      jest.spyOn(usersService as any, 'hashPassword').mockRestore();
      const password = 'plainPassword';
      const hashedPassword = await bcrypt.hash('otherPassword', 10);

      const result = await (usersService as any).comparePasswords(
        password,
        hashedPassword,
      );

      expect(result).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should return a UserSafeDto when username and password are valid', async () => {
      const checkUserData = createUserStub();
      const dbUser = createDbUserStub();
      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(dbUser),
      });

      jest
        .spyOn(usersService as any, 'comparePasswords')
        .mockResolvedValue(true);

      const result = await usersService.checkAuth(
        checkUserData.username,
        checkUserData.password,
      );

      expect(result.username).toBe(checkUserData.username);
      expect(result).not.toHaveProperty('hashedPassword');
    });

    it('should throw NotFoundException when the user is not found', async () => {
      const checkUserData = { ...createUserStub(), username: 'otherName' };
      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        usersService.checkAuth(checkUserData.username, checkUserData.password),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementScore', () => {
    it('should increment the user score by the provided amount', async () => {
      const userId = new Types.ObjectId('66f8f7fb027b5bb2be6d0dd9');
      const score = 10;

      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await usersService.incrementScore(userId, score);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $inc: { score: score },
      });
    });
  });
});
