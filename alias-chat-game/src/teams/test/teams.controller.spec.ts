import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from '../teams.controller';
import { TeamsService } from '../teams.service';
import { createTeamStub, teamArrStub, teamStub } from './stubs/team.stub';
import { playersStub, userStub } from './stubs/user.stub';
import { mockAuthGuard } from '../../users/__mocks__/users-auth.guard.mock';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Team, TeamDocument } from '../schemas/team.schema';
import { CreateTeamDto } from '../dto/create-team.dto';
import { Types } from 'mongoose';
import { UsersService } from '../../users/users.service';
import { UserSafeDto } from '../../users/dto/user-safe.dto';

jest.mock('../teams.service');
jest.mock('../../users/users.service');

describe('TeamsController', () => {
  let teamsController: TeamsController;
  let teamsService: TeamsService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: {
            deleteAllTeams: jest.fn(),
            create: jest.fn().mockResolvedValue(createTeamStub()),
            findAll: jest.fn().mockResolvedValue(teamArrStub()),
            deleteAllTeamsFromRoom: jest
              .fn()
              .mockResolvedValue({ message: 'Success' }),
            findOne: jest.fn().mockResolvedValue(teamStub()),
            remove: jest.fn(),
            findAllTeamPlayers: jest
              .fn()
              .mockResolvedValue([
                playersStub()[0].userId,
                playersStub()[1].userId,
                playersStub()[2].userId,
              ]),
            addPlayerToTeam: jest.fn(),
            removePlayer: jest.fn().mockResolvedValue(teamStub()),
            defineDescriberAndLeader: jest.fn().mockResolvedValue(teamStub()),
            resetRound: jest.fn().mockResolvedValue(createTeamStub()),
            calculateScores: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    teamsController = module.get<TeamsController>(TeamsController);
    teamsService = module.get<TeamsService>(TeamsService);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('when the create method is called', () => {
      let team: Team;
      let createTeamDto: CreateTeamDto;
      let roomId: Types.ObjectId;
      beforeEach(async () => {
        createTeamDto = {
          name: createTeamStub().name,
          players: createTeamStub().players,
        };
        roomId = createTeamStub().roomId;
        team = await teamsController.create(roomId, createTeamDto);
      });

      test('then it should call teamsService.create', () => {
        expect(teamsService.create).toHaveBeenCalledWith(roomId, createTeamDto);
      });

      test('then it should return a team', () => {
        expect(team).toEqual(createTeamStub());
      });
    });
  });

  describe('findAllTeams', () => {
    describe('when the findAllTeams method is called', () => {
      let teams: TeamDocument[];
      let roomId: Types.ObjectId;
      beforeEach(async () => {
        roomId = teamArrStub()[0].roomId;
        teams = await teamsController.findAllTeams(roomId, false);
      });

      test('then it should call teamsService.findAll', () => {
        expect(teamsService.findAll).toHaveBeenCalledWith(roomId, false);
      });

      test('then it should return an array of teams', () => {
        expect(teams).toEqual(teamArrStub());
      });
    });
  });

  describe('deleteAllTeams', () => {
    describe('when the deleteAllTeams method is called', () => {
      let roomId: Types.ObjectId;
      let res: { message };
      beforeEach(async () => {
        roomId = createTeamStub().roomId;
        res = await teamsController.deleteAllTeams(roomId);
      });

      test('then it should call teamsService.create', () => {
        expect(teamsService.deleteAllTeamsFromRoom).toHaveBeenCalledWith(
          roomId,
        );
      });

      test('then it should return a message', () => {
        expect(res).toEqual({ message: 'Success' });
      });
    });
  });

  describe('findOneTeam', () => {
    describe('when the findOneTeam method is called', () => {
      let roomId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let team: TeamDocument;
      beforeEach(async () => {
        roomId = createTeamStub().roomId;
        teamId = createTeamStub()._id;
        team = await teamsController.findOneTeam(roomId, teamId);
      });

      test('then it should call teamsService.findOneTeam', () => {
        expect(teamsService.findOne).toHaveBeenCalledWith(roomId, teamId);
      });

      test('then it should return a message', () => {
        expect(team).toEqual(teamStub());
      });
    });
  });

  describe('removeTeam', () => {
    describe('when the removeTeam method is called', () => {
      let roomId: Types.ObjectId;
      let teamId: Types.ObjectId;
      beforeEach(async () => {
        roomId = createTeamStub().roomId;
        teamId = createTeamStub()._id;
        await teamsController.removeTeam(roomId, teamId);
      });

      test('then it should call teamsService.removeTeam', () => {
        expect(teamsService.remove).toHaveBeenCalledWith(roomId, teamId);
      });
    });
  });

  describe('findAllTeamPlayers', () => {
    describe('when the findAllTeamPlayers method is called', () => {
      let roomId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let players: UserSafeDto[];
      beforeEach(async () => {
        roomId = createTeamStub().roomId;
        teamId = createTeamStub()._id;
        (usersService.getUserById as jest.Mock)
          .mockResolvedValueOnce(playersStub()[0])
          .mockResolvedValueOnce(playersStub()[1])
          .mockResolvedValueOnce(playersStub()[2]);
        players = await teamsController.findAllTeamPlayers(roomId, teamId);
      });

      test('then it should call teamsService.findAllTeamPlayers', () => {
        expect(teamsService.findAllTeamPlayers).toHaveBeenCalledWith(
          roomId,
          teamId,
        );
      });

      test('then it should get users with corresponding ids', () => {
        expect(usersService.getUserById).toHaveBeenCalledWith(
          '60d0fe4f5311236168a109ca',
        );
        expect(usersService.getUserById).toHaveBeenCalledWith(
          '60d0fe4f5311236168a109cb',
        );
        expect(usersService.getUserById).toHaveBeenCalledWith(
          '60d0fe4f5311236168a109cc',
        );
      });

      test('then it should return an array of players records', () => {
        expect(players).toEqual(playersStub());
      });
    });
  });

  describe('addPlayer', () => {
    describe('when the addPlayer method is called', () => {
      let userId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let roomId: Types.ObjectId;
      let res: { message; roomId; teamId };
      beforeEach(async () => {
        userId = userStub().userId;
        teamId = createTeamStub()._id;
        roomId = createTeamStub().roomId;
        (teamsService.addPlayerToTeam as jest.Mock).mockResolvedValueOnce({
          message: 'Player added to the team successfully.',
          roomId: roomId,
          teamId: teamId,
        });
        res = await teamsController.addPlayer(teamId, userId);
      });

      test('then it should call teamsService.addPlayerToTeam', () => {
        expect(teamsService.addPlayerToTeam).toHaveBeenCalledWith(
          userId,
          teamId,
        );
      });

      test('then it should return a message', () => {
        expect(res).toEqual({
          message: 'Player added to the team successfully.',
          roomId: roomId,
          teamId: teamId,
        });
      });
    });
  });

  describe('removePlayer', () => {
    describe('when the removePlayer method is called', () => {
      let userId: Types.ObjectId;
      let teamId: Types.ObjectId;
      let roomId: Types.ObjectId;
      let team: TeamDocument;
      beforeEach(async () => {
        userId = userStub().userId;
        teamId = createTeamStub()._id;
        roomId = createTeamStub().roomId;
        team = await teamsController.removePlayer(roomId, teamId, userId);
      });

      test('then it should call teamsService.removePlayer', () => {
        expect(teamsService.removePlayer).toHaveBeenCalledWith(
          roomId,
          teamId,
          userId,
        );
      });

      test('then it should return a message', () => {
        expect(team).toEqual(teamStub());
      });
    });
  });

  describe('defineDescriberAndLeader', () => {
    describe('when the defineDescriberAndLeader method is called', () => {
      let teamId: Types.ObjectId;
      let roomId: Types.ObjectId;
      let team: TeamDocument;
      beforeEach(async () => {
        teamId = createTeamStub()._id;
        roomId = createTeamStub().roomId;
        team = await teamsController.defineDescriberAndLeader(roomId, teamId);
      });
      test('then it should call teamsService.defineDescriberAndLeader', () => {
        expect(teamsService.defineDescriberAndLeader).toHaveBeenCalledWith(
          roomId,
          teamId,
        );
      });

      test('then it should return a team with updated describer and leader', () => {
        expect(team).toEqual(teamStub());
      });
    });
  });

  describe('resetRound', () => {
    describe('when the resetRound method is called', () => {
      let teamId: Types.ObjectId;
      let roomId: Types.ObjectId;
      let team: TeamDocument;
      beforeEach(async () => {
        teamId = createTeamStub()._id;
        roomId = createTeamStub().roomId;
        team = await teamsController.resetRound(roomId, teamId);
      });
      test('then it should call teamsService.resetRound', () => {
        expect(teamsService.resetRound).toHaveBeenCalledWith(roomId, teamId);
      });

      test('then it should return a team with resetted values', () => {
        expect(team).toEqual(createTeamStub());
      });
    });
  });

  describe('calculateScores', () => {
    describe('when the calculateScores method is called', () => {
      let teamId: Types.ObjectId;
      let res: { message };
      beforeEach(async () => {
        teamId = createTeamStub()._id;
        (teamsService.calculateScores as jest.Mock).mockResolvedValueOnce({
          message: 'Calculared scores',
        });
        res = await teamsController.calculateScores(teamId);
      });
      test('then it should call teamsService.calculateScores', () => {
        expect(teamsService.calculateScores).toHaveBeenCalledWith(teamId);
      });

      test('then it should return a message with result', () => {
        expect(res).toEqual({ message: 'Calculared scores' });
      });
    });
  });
});
