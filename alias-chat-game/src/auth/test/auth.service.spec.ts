import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { Model } from 'mongoose';
import { Auth } from '../schemas/auth.schema';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { User } from '../../users/schemas/user.schema';
import { LoginDto } from '../dto/login.dto';
import { BadRequestException } from '@nestjs/common';
import { UserSafeDto } from '../../users/dto/user-safe.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let authModel: Model<Auth>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(Auth.name),
          useValue: {
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            checkAuth: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    authModel = module.get<Model<Auth>>(getModelToken(Auth.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks after each test
  });

  describe('register', () => {
    it('should register a user and return success message', async () => {
      const createUserDto: CreateUserDto = {
        username: 'test',
        password: 'test',
      };
      const createdUser = { userId: 'testUserId', user: {} as User };

      jest.spyOn(usersService, 'createUser').mockResolvedValueOnce(createdUser);

      const result = await authService.register(createUserDto);

      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        message: 'User registered successfully.',
        data: { userId: createdUser.userId },
      });
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const loginDto: LoginDto = { username: 'test', password: 'test' };
      const user: UserSafeDto = {
        userId: 'testUserId',
        username: 'test',
        score: 0,
        played: 0,
        wins: 0,
      };
      jest.spyOn(usersService, 'checkAuth').mockResolvedValueOnce(user);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');

      jest.spyOn(authModel, 'findOneAndUpdate').mockResolvedValueOnce({
        userId: user.userId,
        refreshToken: 'refreshToken',
      });

      const result = await authService.login(loginDto);

      expect(usersService.checkAuth).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(result).toEqual({
        message: 'User logged successfully.',
        data: {
          access_token: 'accessToken',
          refresh_token: 'refreshToken',
        },
      });
    });

    it('should throw BadRequestException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        username: 'test',
        password: 'wrongPassword',
      };

      jest
        .spyOn(usersService, 'checkAuth')
        .mockRejectedValueOnce(new BadRequestException('Invalid password.'));

      await expect(authService.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should logout the user and delete the refresh token', async () => {
      const userId = 'testUserId';
      jest
        .spyOn(authModel, 'deleteOne')
        .mockResolvedValueOnce({ deletedCount: 1 } as any);

      const result = await authService.logout(userId);

      expect(authModel.deleteOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual({
        message: 'User logged out successfully, refresh token deleted.',
      });
    });
  });

  describe('refresh', () => {
    it('should refresh the access token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'validRefreshToken',
      };
      const decoded = { userId: 'testUserId' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(decoded);
      jest.spyOn(authModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({
          userId: 'testUserId',
          refreshToken: 'validRefreshToken',
        }),
      } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('newAccessToken');

      const result = await authService.refresh(refreshTokenDto);

      expect(authModel.findOne).toHaveBeenCalledWith({
        userId: decoded.userId,
      });
      expect(result).toEqual({
        message: 'Access token updated successfully.',
        data: { access_token: 'newAccessToken' },
      });
    });

    it('should throw BadRequestException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalidRefreshToken',
      };
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ userId: 'testUserId' });

      jest.spyOn(authModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(authService.refresh(refreshTokenDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
