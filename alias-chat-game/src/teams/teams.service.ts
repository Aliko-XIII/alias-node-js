import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './schemas/team.schema';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { SetDescriberDto } from './dto/set-describer.dto';
import { SetTeamLeaderDto } from './dto/set-team-leader.dto';

@Injectable()
export class TeamsService {
  private readonly MAX_USERS_IN_TEAM = 3;
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

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
  ): Promise<Team> {
    const createdTeam = new this.teamModel({ ...createTeamDto, roomId });
    return createdTeam.save();
  }

  /**
   * Retrieves a team by its ID.
   * @param {Types.ObjectId} teamId - The ID of the team to retrieve.
   * @returns {Promise<TeamDocument | null>} - The team document if found, or null if not found.
   * @throws {NotFoundException} - If the specified team is not found.
   */
  async findTeamById(teamId: Types.ObjectId) {
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
  async addPlayerToTeam(userId: Types.ObjectId, teamId: Types.ObjectId) {
    const team = await this.findTeamById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found.');
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
   * Updates a team with the given ID using the provided updateTeamDto.
   * @param {Types.ObjectId} teamId - The ID of the team to be updated.
   * @param {UpdateTeamDto} updateTeamDto - An object containing the fields to be updated.
   * @returns {Promise<TeamDocument | null>} - The updated team document, or null if the team is not found.
   */
  async update(teamId: Types.ObjectId, updateTeamDto: UpdateTeamDto) {
    return this.teamModel
      .findByIdAndUpdate(teamId, updateTeamDto, {
        new: true,
      })
      .exec();
  }

  findAll(roomId: Types.ObjectId) {
    return this.teamModel.find({ roomId }).exec();
  }

  async findOne(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const team = await this.teamModel.findOne({ _id: teamId, roomId }).exec();
    if (!team) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }
    return team;
  }

  async remove(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const result = await this.teamModel
      .deleteOne({ _id: teamId, roomId })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Team ${teamId} in room ${roomId} not found`);
    }
  }

  async findAllTeamPlayers(roomId: Types.ObjectId, teamId: Types.ObjectId) {
    const team = await this.findOne(roomId, teamId);
    return team.players;
  }

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
   * This method defines both the next describer and team leader for the given team in a room.
   * If the describer is not yet defined, the first player in the array will be selected as the describer,
   * and the second player as the team leader. After that, it cycles through the players.
   *
   * @param roomId - The ID of the room where the team is located.
   * @param teamId - The ID of the team for which to define the next describer and leader.
   * @returns The updated team with new describer and leader.
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
}
