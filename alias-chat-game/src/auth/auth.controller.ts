import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './guards/auth.guard';

/**
 * Controller for authorization endpoint.
 */
@Controller('auth')
export class AuthController {
  constructor(
    /**
     * Authorization service
     */
    private readonly authService: AuthService,
  ) {}

  /**
   * Endpoint method for registering a new user.
   * POST /api/v1/auth/register
   * @param {CreateUserDto} createUserDto Request body with user's data.
   * @returns {Promise<{
   * message: string;
   * data: { userId: string } }>} Response body with message and user's ID.
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<{
    message: string;
    data: { userId: string };
  }> {
    return this.authService.register(createUserDto);
  }

  /**
   * Endpoint method for login into user's account.
   * POST /api/v1/auth/login
   * @param {LoginDto} loginDto Request body with user's login data.
   * @returns {Promise<{
   * message: string;
   * data: {
   * access_token: string;
   * refresh_token: string }}>} Response body with message and user's access and refresh tokens.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{
    message: string;
    data: {
      access_token: string;
      refresh_token: string;
    };
  }> {
    return this.authService.login(loginDto);
  }

  /**
   * Endpoint method for refreshing user's access token.
   * POST /api/v1/auth/refresh
   * @param {RefreshTokenDto} refreshTokenDto Request body with user's refresh token.
   * @returns {Promise<{
   * message: string;
   * data: {
   * access_token: string }}>} Response body with message and user's access token.
   */
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{
    message: string;
    data: {
      access_token: string;
    };
  }> {
    return this.authService.refresh(refreshTokenDto);
  }

  /**
   * Endpoint method for logging out of user's session.
   * POST /api/v1/auth/logout
   * @param {@Req() request: Request & { userId: string }} request Request body with user's ID.
   * @returns {Promise<{ message: string }>} Response body with message on logout result.
   */
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() request: Request & { userId: string },
  ): Promise<{ message: string }> {
    const userId = request.userId;
    return this.authService.logout(userId);
  }
}
