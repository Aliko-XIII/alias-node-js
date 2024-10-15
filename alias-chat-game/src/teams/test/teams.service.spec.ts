import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TeamsService } from '../teams.service';
import { Team } from '../schemas/team.schema';
import { createTeamStub } from './stubs/team.stub';
import { UsersService } from '../../users/users.service';
import { RoomsService } from '../../rooms/rooms.service';
import { Model, Types } from 'mongoose';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { NotFoundException } from '@nestjs/common';

describe('TeamsService', () => {
  let teamsService: TeamsService;
  let teamModel: Model<Team>;
  let usersService: Partial<UsersService>;
  let roomsService: Partial<RoomsService>;

  beforeEach(async () => {
    usersService = {};
    roomsService = {};
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getModelToken(Team.name),
          useValue: {
            create: jest.fn(),
            deleteMany: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            findOne: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            findByIdAndDelete: jest.fn(),
            findOneAndUpdate: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            deleteOne: jest.fn(),
          },
        },
        { provide: UsersService, useValue: usersService },
        { provide: RoomsService, useValue: roomsService },
      ],
    }).compile();

    teamsService = moduleRef.get<TeamsService>(TeamsService);
    teamModel = moduleRef.get<Model<Team>>(getModelToken(Team.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new team and save it', async () => {
      const roomId = new Types.ObjectId();
      const createTeamDto = createTeamStub();
      const createdTeam = {
        ...createTeamDto,
        roomId,
        _id: new Types.ObjectId(),
      };

      jest.spyOn(teamModel, 'create').mockResolvedValueOnce(createdTeam as any);

      const result = await teamsService.create(roomId, createTeamDto);

      expect(teamModel.create).toHaveBeenCalledWith({
        ...createTeamDto,
        roomId,
      });
      expect(result).toEqual(createdTeam);
    });
  });

  describe('deleteAllTeams', () => {
    it('should delete all teams and return a success message with the count of deleted teams', async () => {
      const deletedCount = 5;

      (teamModel.deleteMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount }),
      });

      const result = await teamsService.deleteAllTeams();

      expect(teamModel.deleteMany).toHaveBeenCalledWith({});
      expect(result).toEqual({
        message: `Successfully deleted ${deletedCount} teams from the database.`,
      });
    });

    it('should return a message when no teams are found to delete', async () => {
      const deletedCount = 0;

      (teamModel.deleteMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount }),
      });

      const result = await teamsService.deleteAllTeams();

      expect(teamModel.deleteMany).toHaveBeenCalledWith({});
      expect(result).toEqual({
        message: 'No teams found to delete.',
      });
    });
  });

  describe('deleteAllTeamsFromRoom', () => {
    it('should delete all teams from a room and return a success message with the count of deleted teams', async () => {
      const roomId = new Types.ObjectId();
      const deletedCount = 3;

      (teamModel.deleteMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount }),
      });

      const result = await teamsService.deleteAllTeamsFromRoom(roomId);

      expect(teamModel.deleteMany).toHaveBeenCalledWith({ roomId });
      expect(result).toEqual({
        message: `Successfully deleted ${deletedCount} team(s) from room ${roomId}.`,
      });
    });

    it('should return a message when no teams are found in the room', async () => {
      const roomId = new Types.ObjectId();
      const deletedCount = 0;

      (teamModel.deleteMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount }),
      });

      const result = await teamsService.deleteAllTeamsFromRoom(roomId);

      expect(teamModel.deleteMany).toHaveBeenCalledWith({ roomId });
      expect(result).toEqual({
        message: `No teams found in room ${roomId}.`,
      });
    });
  });

  describe('findTeamById', () => {
    it('should return a team when found by ID', async () => {
      const teamId = new Types.ObjectId();
      const team = { ...createTeamStub(), _id: teamId };

      (teamModel.findById as jest.Mock).mockResolvedValueOnce(team);

      const result = await teamsService.findTeamById(teamId);

      expect(teamModel.findById).toHaveBeenCalledWith(teamId);
      expect(result).toEqual(team);
    });

    it('should return null when no team is found by ID', async () => {
      const teamId = new Types.ObjectId();

      (teamModel.findById as jest.Mock).mockResolvedValueOnce(null);

      const result = await teamsService.findTeamById(teamId);

      expect(teamModel.findById).toHaveBeenCalledWith(teamId);
      expect(result).toBeNull();
    });
  });
  describe('update', () => {
    it('should update a team and return the updated team document', async () => {
      const teamId = new Types.ObjectId();
      const updateTeamDto: UpdateTeamDto = { name: 'Updated Team Name' };
      const updatedTeam = {
        ...createTeamStub(),
        _id: teamId,
        ...updateTeamDto,
      };

      (teamModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(updatedTeam),
      });

      const result = await teamsService.update(teamId, updateTeamDto);

      expect(teamModel.findByIdAndUpdate).toHaveBeenCalledWith(
        teamId,
        updateTeamDto,
        { new: true },
      );
      expect(result).toEqual(updatedTeam);
    });

    it('should return null if the team is not found', async () => {
      const teamId = new Types.ObjectId();
      const updateTeamDto: UpdateTeamDto = { name: 'Updated Team Name' };

      (teamModel.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      const result = await teamsService.update(teamId, updateTeamDto);

      expect(teamModel.findByIdAndUpdate).toHaveBeenCalledWith(
        teamId,
        updateTeamDto,
        { new: true },
      );
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all teams sorted by teamScore without populating players', async () => {
      const roomId = new Types.ObjectId();
      const teams = [createTeamStub(), createTeamStub()];

      (teamModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValueOnce(teams),
        }),
      });

      const result = await teamsService.findAll(roomId, false);

      expect(teamModel.find).toHaveBeenCalledWith({ roomId });
      expect(teamModel.find().sort).toHaveBeenCalledWith({ teamScore: -1 });
      expect(result).toEqual(teams);
    });

    it('should return all teams sorted by teamScore and populate players', async () => {
      const roomId = new Types.ObjectId();
      const teams = [createTeamStub(), createTeamStub()];

      (teamModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValueOnce(teams),
          }),
        }),
      });

      const result = await teamsService.findAll(roomId, true);

      expect(teamModel.find).toHaveBeenCalledWith({ roomId });
      expect(teamModel.find().sort).toHaveBeenCalledWith({ teamScore: -1 });
      expect(teamModel.find().sort().populate).toHaveBeenCalledWith('players');
      expect(result).toEqual(teams);
    });
  });

  describe('findOne', () => {
    it('should return the team if found', async () => {
      const roomId = new Types.ObjectId();
      const teamId = new Types.ObjectId();
      const team = createTeamStub();

      (teamModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(team),
      });

      const result = await teamsService.findOne(roomId, teamId);

      expect(teamModel.findOne).toHaveBeenCalledWith({ _id: teamId, roomId });
      expect(result).toEqual(team);
    });

    it('should throw NotFoundException if the team is not found', async () => {
      const roomId = new Types.ObjectId();
      const teamId = new Types.ObjectId();

      (teamModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(teamsService.findOne(roomId, teamId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(teamsService.findOne(roomId, teamId)).rejects.toThrow(
        `Team ${teamId} in room ${roomId} not found!!!`,
      );
    });
  });

  describe('remove', () => {
    it('should delete the team if found', async () => {
      const roomId = new Types.ObjectId();
      const teamId = new Types.ObjectId();

      (teamModel.deleteOne as jest.Mock).mockResolvedValueOnce({
        deletedCount: 1,
      });

      await teamsService.remove(roomId, teamId);

      expect(teamModel.deleteOne).toHaveBeenCalledWith({ _id: teamId, roomId });
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from a team and return the updated team', async () => {
      const roomId = new Types.ObjectId();
      const teamId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const team = {
        _id: teamId,
        roomId,
        players: [],
      };

      (teamModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(team),
      });

      const result = await teamsService.removePlayer(roomId, teamId, userId);

      expect(teamModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: teamId, roomId },
        { $pull: { players: userId } },
        { new: true },
      );
      expect(result).toEqual(team);
    });

    it('should throw NotFoundException if the team is not found', async () => {
      const roomId = new Types.ObjectId();
      const teamId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      (teamModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        teamsService.removePlayer(roomId, teamId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        teamsService.removePlayer(roomId, teamId, userId),
      ).rejects.toThrow(`Team ${teamId} in room ${roomId} not found`);
    });
  });

  describe('defineDescriberAndLeader', () => {
    let roomId: Types.ObjectId;
    let teamId: Types.ObjectId;
    let team: any;

    beforeEach(() => {
      roomId = new Types.ObjectId();
      teamId = new Types.ObjectId();
      team = {
        _id: teamId,
        roomId,
        players: [
          new Types.ObjectId(),
          new Types.ObjectId(),
          new Types.ObjectId(),
        ],
        describer: null,
      };
    });

    it('should set the first player as describer and second player as leader if describer is not defined', async () => {
      (teamModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(team),
      });

      const setTeamLeaderSpy = jest
        .spyOn(teamsService as any, 'setTeamLeader')
        .mockResolvedValueOnce(team);
      const setDescriberSpy = jest
        .spyOn(teamsService as any, 'setDescriber')
        .mockResolvedValueOnce(team);

      const result = await teamsService.defineDescriberAndLeader(
        roomId,
        teamId,
      );

      expect(teamModel.findOne).toHaveBeenCalledWith({ _id: teamId, roomId });
      expect(setDescriberSpy).toHaveBeenCalledWith(roomId, teamId, {
        userId: team.players[0],
      });
      expect(setTeamLeaderSpy).toHaveBeenCalledWith(roomId, teamId, {
        userId: team.players[1],
      });
      expect(result).toEqual(team);
    });

    it('should cycle the describer and set the next player as leader if describer is already defined', async () => {
      team.describer = team.players[0];

      (teamModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(team),
      });

      const setTeamLeaderSpy = jest
        .spyOn(teamsService as any, 'setTeamLeader')
        .mockResolvedValueOnce(team);
      const setDescriberSpy = jest
        .spyOn(teamsService as any, 'setDescriber')
        .mockResolvedValueOnce(team);

      const result = await teamsService.defineDescriberAndLeader(
        roomId,
        teamId,
      );

      expect(setDescriberSpy).toHaveBeenCalledWith(roomId, teamId, {
        userId: team.players[1],
      });
      expect(setTeamLeaderSpy).toHaveBeenCalledWith(roomId, teamId, {
        userId: team.players[2],
      });
      expect(result).toEqual(team);
    });

    it('should throw NotFoundException if the team is not found', async () => {
      (teamModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        teamsService.defineDescriberAndLeader(roomId, teamId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        teamsService.defineDescriberAndLeader(roomId, teamId),
      ).rejects.toThrow(`Team ${teamId} in room ${roomId} not found`);
    });
  });

  describe('resetRound', () => {
    let roomId: Types.ObjectId;
    let teamId: Types.ObjectId;

    beforeEach(() => {
      roomId = new Types.ObjectId();
      teamId = new Types.ObjectId();
    });

    it('should reset round-specific fields for the team', async () => {
      const updatedTeam = {
        _id: teamId,
        roomId,
        selectedWord: null,
        description: null,
        success: null,
        answer: null,
      };

      (teamModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedTeam),
      });

      const result = await teamsService.resetRound(roomId, teamId);

      expect(teamModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: teamId, roomId },
        {
          $set: {
            selectedWord: null,
            description: null,
            success: null,
            answer: null,
          },
        },
        { new: true },
      );
      expect(result).toEqual(updatedTeam);
      expect(result.selectedWord).toBeNull();
      expect(result.description).toBeNull();
      expect(result.success).toBeNull();
      expect(result.answer).toBeNull();
    });

    it('should throw NotFoundException if the team is not found', async () => {
      (teamModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(teamsService.resetRound(roomId, teamId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(teamsService.resetRound(roomId, teamId)).rejects.toThrow(
        `Team ${teamId} in room ${roomId} not found`,
      );
    });
  });
});
