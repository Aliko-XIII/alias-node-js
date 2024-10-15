import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { SetDescriberDto } from './dto/set-describer.dto';
import { SetTeamLeaderDto } from './dto/set-team-leader.dto';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class TeamsService {
  private readonly MAX_USERS_IN_TEAM: number = 3;
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
  ) {}

  /**
   * Creates a new team within a specified room.
   * @param {Types.ObjectId} roomId - The ID of the room where the team will be created.
   * @param {CreateTeamDto} createTeamDto - The data transfer object containing the details of the team to be created.
   * @returns {Promise<TeamDocument>} - The newly created team document.
   * @throws {InternalServerErrorException} - If an error occurs during the database operation.
   */
  async create(
    roomId: Types.ObjectId,
    createTeamDto: CreateTeamDto,
  ): Promise<TeamDocument> {
    const createdTeam = await this.teamModel.create({
      ...createTeamDto,
      roomId,
    });
    return createdTeam;
  }

  /**
   * Deletes all teams from database.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the deletion operation.
   */
  async deleteAllTeams(): Promise<{ message: string }> {
    const { deletedCount } = await this.teamModel.deleteMany({}).exec();
    return {
      message:
        deletedCount > 0
          ? `Successfully deleted ${deletedCount} teams from the database.`
          : 'No teams found to delete.',
    };
  }

  /**
   * Deletes all teams from a specific room.
   * @param {Types.ObjectId} roomId - The ID of the room from which to delete all teams.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the deletion operation.
   */
  async deleteAllTeamsFromRoom(
    roomId: Types.ObjectId,
  ): Promise<{ message: string }> {
    const { deletedCount } = await this.teamModel.deleteMany({ roomId }).exec();
    return {
      message:
        deletedCount > 0
          ? `Successfully deleted ${deletedCount} team(s) from room ${roomId}.`
          : `No teams found in room ${roomId}.`,
    };
  }

  /**
   * Retrieves a team by its ID.
   * @param {Types.ObjectId} teamId - The ID of the team to retrieve.
   * @returns {Promise<TeamDocument | null>} - The team document if found, or null if not found.
   * @throws {NotFoundException} - If the specified team is not found.
   */
  async findTeamById(teamId: Types.ObjectId): Promise<TeamDocument | null> {
    return await this.teamModel.findById(teamId);
  }

  /**
   * Adds a user to a specified team. If the team is full, an error is thrown.
   * @param {Types.ObjectId} userId - The ID of the user to be added to the team.
   * @param {Types.ObjectId} teamId - The ID of the team to which the user will be added.
   * @returns {Promise<Object>} - An object containing a success message, the room ID, and the team ID.
   * @throws {NotFoundException} - If the specified team is not found.
   * @throws {BadRequestException} - If the team is already full.
   */
  async addPlayerToTeam(
    userId: Types.ObjectId,
    teamId: Types.ObjectId,
  ): Promise<{ message; roomId; teamId }> {
    const team = await this.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found.');
    }
    const roomTeams = await this.findAll(team.roomId);
    let joined = false;
    roomTeams.forEach((team) => {
      team.players.forEach((playerId) => {
        if (playerId.toString() == userId.toString()) {
          joined = true;
        }
      });
    });
    if (joined) {
      return {
        message: `User ${userId.toString()} already joined to team`,
        roomId: null,
        teamId: null,
      };
    }

    if (team.players.length >= this.MAX_USERS_IN_TEAM) {
      throw new BadRequestException('Team is already full.');
    }

    if (!team.players.includes(userId)) {
      team.players.push(userId);
      await this.update(teamId, { players: team.players });
    } else {
      throw new BadRequestException('User is already in the team.');
    }

    return {
      message: 'Player added to the team successfully.',
      roomId: team.roomId,
      teamId: team._id,
    };
  }

  /**
   * Removes a user from a specified team.
   * @param {Types.ObjectId} userId - The ID of the user to be removed from the team.
   * @param {Types.ObjectId} teamId - The ID of the team from which the user will be removed.
   * @returns {Promise<Object>} - An object containing a success message, the room ID, and the team ID.
   * @throws {NotFoundException} - If the specified team is not found.
   * @throws {BadRequestException} - If the team doesn't have user.
   */
  async removePlayerFromTeam(
    userId: Types.ObjectId,
    teamId: Types.ObjectId,
  ): Promise<object> {
    const team = await this.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    if (team.players.includes(userId)) {
      team.players = team.players.filter(
        (id) => id.toString() !== userId.toString(),
      );
      await this.update(teamId, { players: team.players });
    } else {
      throw new BadRequestException('User is not in the team.');
    }

    return {
      message: 'Player removed from the team successfully.',
      roomId: team.roomId,
      teamId: team._id,
    };
  }

  /**
   * Updates a team with the given ID using the provided updateTeamDto.
   * @param {Types.ObjectId} teamId - The ID of the team to be updated.
   * @param {UpdateTeamDto} updateTeamDto - An object containing the fields to be updated.
   * @returns {Promise<TeamDocument | null>} - The updated team document, or null if the team is not found.
   */
  async update(
    teamId: Types.ObjectId,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TeamDocument | null> {
    return this.teamModel
      .findByIdAndUpdate(teamId, updateTeamDto, {
        new: true,
      })
      .exec();
  }

  /**
   * Retrieves all teams within a specified room, sorted by team score.
   * @param {Types.ObjectId} roomId - The ID of the room from which to retrieve teams.
   * @param {boolean} nestUsers - Optional parameter to include player details in the response.
   * @returns {Promise<TeamDocument[]>} - An array of team documents for the specified room.
   */
  findAll(roomId: Types.ObjectId, nestUsers: boolean = false) {
    let query = this.teamModel.find({ roomId }).sort({ teamScore: -1 });

    if (nestUsers) {
      query = query.populate('players');
    }

    return query.exec();
  }

  /**
   * Retrieves a specific team within a specified room by its ID.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team to be retrieved.
   * @returns {Promise<TeamDocument>} - The team document for the specified team and room.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  async findOne(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const team = await this.teamModel.findOne({ _id: teamId, roomId }).exec();
    if (!team) {
      throw new NotFoundException(
        `Team ${teamId} in room ${roomId} not found!!!`,
      );
    }
    return team;
  }

  /**
   * Removes a team from a specified room by its ID.
   * @param {Types.ObjectId} roomId - The ID of the room from which the team will be removed.
   * @param {Types.ObjectId} teamId - The ID of the team to be removed.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  async remove(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const result = await this.teamModel.deleteOne({ _id: teamId, roomId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }
  }

  /**
   * Retrieves all players belonging to a specific team within a specified room.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team whose players will be retrieved.
   * @returns {Promise<Types.ObjectId[]>} - An array of player IDs belonging to the specified team.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  async findAllTeamPlayers(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const team = await this.findOne(roomId, teamId);
    return team.players;
  }

  /**
   * Removes a player from a specified team within a specified room.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team from which the player will be removed.
   * @param {Types.ObjectId} userId - The ID of the player to be removed.
   * @returns {Promise<TeamDocument>} - The updated team document after the player has been removed.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  async removePlayer(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const team = await this.teamModel
      .findOneAndUpdate(
        { _id: teamId, roomId },
        { $pull: { players: userId } },
        { new: true },
      )
      .exec();

    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }

    return team;
  }

  /**
   * Defines the next describer and team leader for a specified team within a room.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team for which the describer and leader will be defined.
   * @returns {Promise<void>} - A promise indicating the successful assignment of the describer and leader.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  async defineDescriberAndLeader(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
  ) {
    const team = await this.teamModel.findOne({ _id: teamId, roomId }).exec();

    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }

    const { players, describer } = team;

    // If describer is not yet set (first round), start with the first player as describer.
    const currentDescriberIndex = describer ? players.indexOf(describer) : -1;

    // Determine the next describer index: if no describer yet, start at 0 (first player).
    const nextDescriberIndex = (currentDescriberIndex + 1) % players.length;
    const nextDescriber = players[nextDescriberIndex];

    // Determine the next team leader index: the player after the next describer.
    const nextLeaderIndex = (nextDescriberIndex + 1) % players.length;
    const nextLeader = players[nextLeaderIndex];

    await this.setDescriber(roomId, teamId, { userId: nextDescriber });
    return this.setTeamLeader(roomId, teamId, { userId: nextLeader });
  }

  /**
   * Sets the describer for a specified team within a room.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team for which the describer will be set.
   * @param {SetDescriberDto} setDescriberDto - The data transfer object containing the ID of the user to be set as describer.
   * @returns {Promise<TeamDocument>} - The updated team document with the new describer.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  private async setDescriber(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
    setDescriberDto: SetDescriberDto,
  ) {
    const team = await this.teamModel
      .findOneAndUpdate(
        { _id: teamId, roomId },
        { describer: setDescriberDto.userId },
        { new: true },
      )
      .exec();

    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }

    return team;
  }

  /**
   * Sets the team leader for a specified team within a room.
   * @param {Types.ObjectId} roomId - The ID of the room containing the team.
   * @param {Types.ObjectId} teamId - The ID of the team for which the leader will be set.
   * @param {SetTeamLeaderDto} setTeamLeaderDto - The data transfer object containing the ID of the user to be set as team leader.
   * @returns {Promise<TeamDocument>} - The updated team document with the new team leader.
   * @throws {NotFoundException} - If the specified team does not exist in the room.
   */
  private async setTeamLeader(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
    setTeamLeaderDto: SetTeamLeaderDto,
  ) {
    const team = await this.teamModel
      .findOneAndUpdate(
        { _id: teamId, roomId },
        { teamLeader: setTeamLeaderDto.userId },
        { new: true },
      )
      .exec();

    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }

    return team;
  }

  /**
   * Resets the round-specific fields (description, success, answer) to null for the given team.
   * @param roomId - The ID of the room where the team is located.
   * @param teamId - The ID of the team whose round fields will be reset.
   * @returns {Promise<TeamDocument>} - The updated team document with nullified fields.
   */
  async resetRound(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
  ): Promise<TeamDocument> {
    const team = await this.teamModel
      .findOneAndUpdate(
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
      )
      .exec();

    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }

    return team;
  }

  /**
   * Calculates and updates the scores for a specified team and its players based on their success status.
   * @param {Types.ObjectId} teamId - The ID of the team for which scores will be calculated.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the score calculation.
   * @throws {NotFoundException} - If the specified team is not found.
   */
  async calculateScores(teamId: Types.ObjectId): Promise<{ message: string }> {
    const team = await this.findTeamById(teamId);

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    if (team.success) {
      team.teamScore += 10;
      await team.save();

      const playerIds = team.players;
      for (const playerId of playerIds) {
        await this.usersService.incrementScore(playerId, 10);
      }

      return {
        message: 'Team and player scores have been successfully updated.',
      };
    } else {
      return { message: 'No score update as the team did not succeed.' };
    }
  }

  /**
   * Starts an interval for managing rounds in a game, handling team rotations and determining the winning team.
   * @param {Types.ObjectId} roomId - The ID of the room in which the game is being played.
   * @param {Types.ObjectId} teamId - The ID of the team currently playing.
   * @returns {void} - This method does not return a value.
   * @throws {NotFoundException} - Throws if the team or room cannot be found during the process.
   */
  async startIntervalRoundManage(
    roomId: Types.ObjectId,
    teamId: Types.ObjectId,
  ) {
    Logger.log(`Start interval ${roomId}-${teamId}`);
    let turnCounter = 0;
    const intervalId = setInterval(async () => {
      let team = await this.findTeamById(teamId);
      // Reset if game continues
      if (turnCounter < 2) {
        turnCounter++;
        team = await this.resetRound(roomId, teamId);
        team = await this.defineDescriberAndLeader(roomId, teamId);
      } else {
        Logger.log(`Stop interval ${roomId}-${teamId}`);
        const room = await this.roomsService.findOne(roomId);
        const teams = await Promise.all(
          room.teams.map(async (teamId) => await this.findTeamById(teamId)),
        );

        const highestScore = Math.max(...teams.map((team) => team.teamScore));

        const allTeamsSameScore = teams.every(
          (team) => team.teamScore === highestScore,
        );

        let teamWon = false;

        if (!allTeamsSameScore) {
          teamWon = teams.some(
            (team) =>
              team.teamScore === highestScore &&
              team._id.toString() === teamId.toString(),
          );
        }
        await Promise.all(
          team.players.map(
            async (userId) =>
              await this.usersService.addGameResult(userId, teamWon),
          ),
        );
        clearInterval(intervalId);
        setTimeout(() => {
          Logger.log(`Timeout start ${roomId}-${team._id}`);
          this.resetTeam(team, roomId);
        }, 10000);
      }
    }, 85000);
  }

  /**
   * Resets a team by removing all players from the specified room and creating a new team entry.
   * @param {TeamDocument} team - The team document to be reset.
   * @param {Types.ObjectId} roomId - The ID of the room where the team is located.
   * @returns {Promise<void>} - This method does not return a value.
   * @throws {NotFoundException} - Throws if the team is not found during the process.
   */
  async resetTeam(team: TeamDocument, roomId: Types.ObjectId) {
    // Remove all team players from room
    await Promise.all(
      team.players.map(async (userId) => {
        await this.roomsService.removeUserFromRoom(userId, roomId);
      }),
    );
    const newTeam: CreateTeamDto & { roomId: Types.ObjectId } = {
      roomId,
      name: team.name,
      players: [],
    };
    // Remove old team from DB
    await this.remove(roomId, team._id);
    await this.roomsService.clearTeams(roomId);

    // Add new team to DB
    const createdTeam = await this.create(roomId, newTeam);
    await this.roomsService.updateTeam(roomId, [createdTeam._id]);
  }
}
