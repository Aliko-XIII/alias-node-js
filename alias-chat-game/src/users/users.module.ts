import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import {
  ArchivedUser,
  ArchivedUserSchema,
} from './schemas/archived-user.schema';
import { JwtModule } from '@nestjs/jwt';
import { RoomsModule } from 'src/rooms/rooms.module';
import { TeamsModule } from 'src/teams/teams.module';

/**
 * UsersModule sets up the User and ArchivedUser models,
 * and provides UsersService to handle user-related logic.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ArchivedUser.name, schema: ArchivedUserSchema },
    ]),
    JwtModule.register({
      secret: 'AliasSecret',
      signOptions: { expiresIn: '1h' },
    }),
    RoomsModule,
    forwardRef(() => TeamsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
