import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { WordsModule } from './words/words.module';
import { RoomsModule } from './rooms/rooms.module';
import { TeamsModule } from './teams/teams.module';
import { ChatsModule } from './chats/chats.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { InitializationService } from './initialization/initialization.service';
import { DatabaseModule } from './database/database.module';
import { LoggingMiddleware } from './middlewares/logging.middleware';
import { XssMiddleware } from './middlewares/xss.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UsersModule,
    TeamsModule,
    RoomsModule,
    WordsModule,
    MessagesModule,
    ChatsModule,
    AuthModule,
    LeaderboardsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, InitializationService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, XssMiddleware).forRoutes('*');
  }
}
