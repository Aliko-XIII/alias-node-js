import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { Word, WordSchema } from './schemas/word.schema';
import { TeamsModule } from '../teams/teams.module'; // Import TeamsModule
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Word.name, schema: WordSchema }]),
    UsersModule,
    TeamsModule,
    JwtModule.register({
      secret: 'AliasSecret',
    }),
  ],
  controllers: [WordsController],
  providers: [WordsService],
  exports: [WordsService, MongooseModule],
})
export class WordsModule {}
