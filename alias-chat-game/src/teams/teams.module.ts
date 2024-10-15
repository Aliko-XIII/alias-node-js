import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team, TeamSchema } from './schemas/team.schema';
import { UsersModule } from '../users/users.module';
import { UserSchema } from '../users/schemas/user.schema';
import { RoomsModule } from '../rooms/rooms.module';

/**
 * TeamsModule configures the Team and User models,
 * and provides TeamsService to manage team-related operations.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: 'users', schema: UserSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => RoomsModule),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService, MongooseModule],
})
export class TeamsModule {}
