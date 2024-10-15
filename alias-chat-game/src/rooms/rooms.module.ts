import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

/**
 * RoomsModule sets up the Room model and provides
 * RoomsService to handle room-related logic
 */
@Module({
  imports: [
    JwtModule.register({
      secret: 'AliasSecret',
    }),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    TeamsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
