import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team, TeamSchema } from './schemas/team.schema';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: 'users', schema: UserSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService, MongooseModule],
})
export class TeamsModule {}
