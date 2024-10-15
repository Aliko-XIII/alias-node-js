import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserSafeDto } from '../dto/user-safe.dto';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { safeUserStub } from './stubs/safe-user.stub';
import { mockAuthGuard } from '../__mocks__/users-auth.guard.mock';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RoomsService } from '../../rooms/rooms.service';
import { TeamsService } from '../../teams/teams.service';
import {
  createTestRoom,
  createTestTeam,
} from './stubs/test-data-creators.stub';

jest.mock('../users.service');

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let roomsService: RoomsService;
  let teamsService: TeamsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: RoomsService,
          useValue: {
            addUserToRoom: jest.fn(),
            removeUserFromRoom: jest.fn(),
            isRoomReady: jest.fn(),
            startGame: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: {
            addPlayerToTeam: jest.fn(),
            removePlayerFromTeam: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    usersController = moduleRef.get<UsersController>(UsersController);
    usersService = moduleRef.get<UsersService>(UsersService);
    roomsService = moduleRef.get<RoomsService>(RoomsService);
    teamsService = moduleRef.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    describe('when the findAll method is called', () => {
      let users: UserSafeDto[];

      beforeEach(async () => {
        users = await usersController.findAll();
      });

      test('then it should call usersService.getUsers', () => {
        expect(usersService.getUsers).toHaveBeenCalled();
      });

      test('then it should return an array of users', () => {
        expect(users).toEqual([safeUserStub()]);
      });
    });
  });

  describe('findOne', () => {
    describe('when the findOne method is called with a valid user ID', () => {
      let user: UserSafeDto;

      beforeEach(async () => {
        user = await usersController.findOne(
          new Types.ObjectId(safeUserStub().userId),
        );
      });

      test('then it should call usersService.getUserById with the correct ID', () => {
        expect(usersService.getUserById).toHaveBeenCalledWith(
          new Types.ObjectId(safeUserStub().userId),
        );
      });

      test('then it should return the corresponding user', () => {
        expect(user).toEqual(safeUserStub());
      });
    });
  });

  describe('remove', () => {
    describe('when the remove method is called', () => {
      let response: { message: string };

      beforeEach(async () => {
        response = await usersController.remove(
          new Types.ObjectId(safeUserStub().userId),
          'true',
        );
      });

      test('then it should call usersService.removeUser with the correct parameters', () => {
        expect(usersService.removeUser).toHaveBeenCalledWith(
          new Types.ObjectId(safeUserStub().userId),
          true,
        );
      });

      test('then it should return a success message when the user is successfully deleted', () => {
        expect(response).toEqual({
          message: 'User account permanently deleted.',
        });
      });
    });
  });

  describe('update', () => {
    describe('when the update method is called', () => {
      let user: UserSafeDto;
      let updateUserDto: UpdateUserDto;

      beforeEach(async () => {
        updateUserDto = {
          username: 'Markus',
        };
        user = await usersController.update(
          new Types.ObjectId(safeUserStub().userId),
          updateUserDto,
        );
      });

      test('then it should usersService.updateUser with the correct parameters', () => {
        expect(usersService.updateUser).toHaveBeenCalledWith(
          new Types.ObjectId(safeUserStub().userId),
          updateUserDto,
        );
      });

      test('then it should return the updated user object on successful update', () => {
        expect(user).toEqual(safeUserStub());
      });
    });
  });

  describe('joinRoom', () => {
    describe('when the joinRoom method is called', () => {
      let room;

      beforeEach(async () => {
        room = createTestRoom('TestRoom1');
        jest.spyOn(roomsService, 'addUserToRoom').mockResolvedValue(room);
        room = await usersController.joinRoom(
          new Types.ObjectId(safeUserStub().userId),
        );
      });

      test('then it should call roomsService.addUserToRoom with the correct userId', () => {
        expect(roomsService.addUserToRoom).toHaveBeenCalledWith(
          new Types.ObjectId(safeUserStub().userId),
        );
      });

      test('then it should return the room the user joined', () => {
        expect(room).toEqual(createTestRoom('TestRoom1'));
      });
    });
  });

  describe('leaveRoom', () => {
    describe('when the leaveRoom method is called', () => {
      let roomId: Types.ObjectId;
      let userId: Types.ObjectId;
      let room;

      beforeEach(async () => {
        userId = new Types.ObjectId();
        roomId = new Types.ObjectId();

        room = createTestRoom('TestRoom1');
        jest.spyOn(roomsService, 'removeUserFromRoom').mockResolvedValue(room);

        room = await usersController.leaveRoom(userId, roomId);
      });

      test('then it should call roomsService.removeUserFromRoom with the correct userId and roomId', () => {
        expect(roomsService.removeUserFromRoom).toHaveBeenCalledWith(
          userId,
          roomId,
        );
      });

      test('then it should return the updated room after the user leaves', () => {
        expect(room).toEqual(createTestRoom('TestRoom1'));
      });
    });
  });

  describe('joinTeam', () => {
    describe('when the joinTeam method is called', () => {
      let userId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let team;

      beforeEach(async () => {
        userId = new Types.ObjectId();
        teamId = new Types.ObjectId();
        team = createTestTeam('TestTeam1', new Types.ObjectId(), [userId]);

        jest.spyOn(teamsService, 'addPlayerToTeam').mockResolvedValue({
          message: 'Player added to the team successfully.',
          roomId: team.roomId,
          teamId,
        });
        jest.spyOn(roomsService, 'isRoomReady').mockResolvedValue(true);
        jest.spyOn(roomsService, 'startGame').mockImplementation(jest.fn());

        team = await usersController.joinTeam(userId, teamId);
      });

      test('then it should call teamsService.addPlayerToTeam with the correct userId and teamId', () => {
        expect(teamsService.addPlayerToTeam).toHaveBeenCalledWith(
          userId,
          teamId,
        );
      });

      test('then it should check if the room is ready', () => {
        expect(roomsService.isRoomReady).toHaveBeenCalledWith(team.roomId);
      });

      test('then it should start the game if the room is ready', () => {
        expect(roomsService.startGame).toHaveBeenCalledWith(team.roomId);
      });

      test('then it should return the updated team with message, roomId, and teamId', () => {
        expect(team).toEqual({
          message: 'Player added to the team successfully.',
          roomId: expect.any(Types.ObjectId),
          teamId: teamId,
        });
      });
    });
  });

  describe('leaveTeam', () => {
    describe('when the leaveTeam method is called', () => {
      let userId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let team;

      beforeEach(async () => {
        userId = new Types.ObjectId();
        teamId = new Types.ObjectId();
        team = createTestTeam('TestTeam1', new Types.ObjectId(), [userId]);

        jest.spyOn(teamsService, 'removePlayerFromTeam').mockResolvedValue({
          message: 'Player removed from the team successfully.',
          roomId: team.roomId,
          teamId,
        });

        team = await usersController.leaveTeam(userId, teamId);
      });

      test('then it should call teamsService.removePlayerFromTeam with the correct userId and teamId', () => {
        expect(teamsService.removePlayerFromTeam).toHaveBeenCalledWith(
          userId,
          teamId,
        );
      });

      test('then it should return the updated team with a message and remaining players', () => {
        expect(team).toEqual({
          message: 'Player removed from the team successfully.',
          roomId: expect.any(Types.ObjectId),
          teamId: teamId,
        });
      });
    });
  });
});
