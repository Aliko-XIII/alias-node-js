import { CanActivate } from '@nestjs/common';

export const mockAuthGuard: CanActivate = { canActivate: jest.fn(() => true) };
