import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateTeamDto } from '../teams/dto/create-team.dto';
import { TeamsService } from '../teams/teams.service';

// RoomsService responsible for handling room-related operations.
@Injectable()
export class RoomsService {
  private readonly MAX_USERS_IN_ROOM = 9;

  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
  ) {}

  /**
   * Creates a new room in the database.
   * @param {CreateRoomDto} createRoomDto - The data transfer object containing the details of the room to be created.
   * @returns {Promise<RoomDocument>} - The newly created room document.
   * @throws {ConflictException} - If a room with the same name already exists.
   * @throws {InternalServerErrorException} - If an error occurs during the database operation.
   */
  async create(createRoomDto: CreateRoomDto) {
    try {
      return await this.roomModel.create(createRoomDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Room with name ${createRoomDto.name} already exists`,
        );
      }
      throw new InternalServerErrorException('Could not create room');
    }
  }

  /**
   * Retrieves all rooms from the database.
   * @returns {Promise<RoomDocument[]>} - A list of all room documents.
   */
  async findAll() {
    return await this.roomModel.find().exec();
  }

  async clearTeams(roomId: Types.ObjectId) {
    const room = await this.findOne(roomId);
    room.teams = [];
    room.save();
  }

  /**
   * Retrieves a specific room by its ID.
   * @param {Types.ObjectId} id - The ID of the room to retrieve.
   * @returns {Promise<RoomDocument>} - The requested room document.
   * @throws {NotFoundException} - If the room with the given ID is not found.
   * @throws {BadRequestException} - If the provided ID is invalid.
   */
  async findOne(id: Types.ObjectId): Promise<RoomDocument> {
    this.validateId(id);
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} is not found`);
    }
    return room;
  }

  /**
   * Updates a room by its ID.
   * @param {Types.ObjectId} id - The ID of the room to update.
   * @param {UpdateRoomDto} updateRoomDto - The data transfer object containing the room's updated data.
   * @returns {Promise<RoomDocument>} - The updated room document.
   * @throws {NotFoundException} - If the room with the given ID is not found.
   * @throws {BadRequestException} - If the provided ID is invalid.
   */
  async update(id: Types.ObjectId, updateRoomDto: UpdateRoomDto) {
    this.validateId(id);
    const updatedRoom = await this.roomModel.findByIdAndUpdate(
      id,
      updateRoomDto,
      { new: true },
    );
    if (!updatedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return updatedRoom;
  }

  /**
   * Deletes a room by its ID.
   * @param {Types.ObjectId} id - The ID of the room to delete.
   * @returns {Promise<void>} - No content is returned on success.
   * @throws {NotFoundException} - If the room with the given ID is not found.
   * @throws {BadRequestException} - If the provided ID is invalid.
   */
  async delete(id: Types.ObjectId) {
    this.validateId(id);
    const deletedRoom = await this.roomModel.findByIdAndDelete(id);
    if (!deletedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  /**
   * Validates the given room ID.
   * @param {Types.ObjectId} id - The ID to validate.
   * @throws {BadRequestException} - If the provided ID is not a valid MongoDB ObjectId.
   */
  private validateId(id: Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Invalid ID');
  }

  /**
   * Finds the first available room with less than the maximum allowed users.
   * @returns {Promise<RoomDocument | null>} - The first available room or null if none is found.
   */
  async findFirstAvailableRoom(): Promise<RoomDocument | null> {
    return await this.roomModel
      .findOne({
        $expr: { $lt: [{ $size: '$joinedUsers' }, this.MAX_USERS_IN_ROOM] },
      })
      .sort({ joinedUsers: -1 })
      .exec();
  }

  /**
   * Adds a user to an available room. If the room reaches maximum capacity, a new room is created.
   * @param {Types.ObjectId} userId - The ID of the user to be added to the room.
   * @returns {Promise<RoomDocument | null>} - The updated room after adding the user, or null if no room is available.
   * @throws {NotFoundException} - If there are no available rooms to join.
   * @throws {InternalServerErrorException} - If an error occurs during the database operation.
   */
  async addUserToRoom(userId: Types.ObjectId): Promise<RoomDocument | null> {
    try {
      const room = await this.findFirstAvailableRoom();

      if (!room) {
        throw new NotFoundException('No available rooms to join.');
      }

      if (!room.joinedUsers.includes(userId)) {
        room.joinedUsers.push(userId);
      }

      await room.save();

      if (room.joinedUsers.length === this.MAX_USERS_IN_ROOM - 1) {
        const createdRoom = await this.create({
          name: `Room${Date.now()}`,
          teams: [],
          turnTime: 60,
        });
        await this.addTeamsToRoom(createdRoom._id);
      }

      return room;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not add user to room.');
    }
  }

  /**
   * Remove a user from an available room.
   * @param {Types.ObjectId} userId - The ID of the user to be removed from the room.
   * @returns {Promise<RoomDocument | null>} - The updated room after removing the user, or null if no room is available.
   * @throws {NotFoundException} - If there are no available rooms to join.
   * @throws {InternalServerErrorException} - If an error occurs during the database operation.
   */
  async removeUserFromRoom(
    userId: Types.ObjectId,
    roomId: Types.ObjectId,
  ): Promise<RoomDocument | null> {
    try {
      const room = await this.findOne(roomId);
      if (!room) {
        throw new NotFoundException('Room does not exist.');
      }
      if (room.joinedUsers.includes(userId)) {
        room.joinedUsers = room.joinedUsers.filter(
          (id) => id.toString() !== userId.toString(),
        );
      }
      await room.save();
      return room;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not remove user from a room.',
      );
    }
  }

  /**
   * Adds default teams to a specified room.
   * The default teams created are Team1, Team2, and Team3, each initialized with an empty players array.
   * @param {Types.ObjectId} roomId - The ID of the room to which teams will be added.
   */
  private async addTeamsToRoom(roomId: Types.ObjectId) {
    const teams: (CreateTeamDto & { roomId: Types.ObjectId })[] = [
      { roomId, name: 'Team1', players: [] },
      { roomId, name: 'Team2', players: [] },
      { roomId, name: 'Team3', players: [] },
    ];

    const teamIds: Types.ObjectId[] = [];

    for (const team of teams) {
      const createdTeam = await this.teamsService.create(roomId, team);
      teamIds.push(createdTeam._id);
    }

    await this.updateTeam(roomId, teamIds);
  }

  /**
   * Updates a room by adding specified team IDs to its list of teams.
   * @param {Types.ObjectId} roomId - The ID of the room to update.
   * @param {Types.ObjectId[]} teamIds - An array of team IDs to add to the room.
   * @returns {Promise<RoomDocument | null>} - The updated room document after adding the teams, or null if the room is not found.
   * @throws {NotFoundException} - If the room with the specified ID is not found.
   */
  async updateTeam(
    roomId: Types.ObjectId,
    teamIds: Types.ObjectId[],
  ): Promise<RoomDocument | null> {
    return this.roomModel.findByIdAndUpdate(
      roomId,
      { $addToSet: { teams: { $each: teamIds } } },
      { new: true },
    );
  }

  /**
   * Deletes all rooms in the database.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the deletion operation.
   */
  async deleteAllRooms(): Promise<{ message: string }> {
    const { deletedCount } = await this.roomModel.deleteMany({});
    return {
      message:
        deletedCount > 0
          ? `Successfully deleted ${deletedCount} rooms.`
          : 'No rooms found to delete.',
    };
  }

  /**
   * Checks if all teams in the specified room are ready, meaning each team has the maximum number of players.
   * @param {Types.ObjectId} roomId - The ID of the room to check.
   * @returns {Promise<boolean>} - Returns true if all teams in the room have the maximum number of players, false otherwise.
   * @throws {NotFoundException} - If the room with the given ID is not found.
   */
  async isRoomReady(roomId) {
    const MAX_USERS_IN_TEAM = 3;
    const room = await this.findOne(roomId);
    return (
      await Promise.all(
        room.teams.map(async (teamId) => {
          const players = (await this.teamsService.findTeamById(teamId))
            .players;
          return players.length >= MAX_USERS_IN_TEAM;
        }),
      )
    ).every(Boolean);
  }

  /**
   * Starts the game in the specified room by defining the describer and leader for each team
   * and initiating the round management process for each team.
   * @param {Types.ObjectId} roomId - The ID of the room where the game will be started.
   * @returns {Promise<void>} - No content on success.
   * @throws {NotFoundException} - If the room with the given ID is not found.
   */
  async startGame(roomId) {
    const room = await this.findOne(roomId);
    room.teams.forEach(async (teamId) => {
      await this.teamsService.defineDescriberAndLeader(roomId, teamId);
      await this.teamsService.startIntervalRoundManage(roomId, teamId);
    });
  }
}
