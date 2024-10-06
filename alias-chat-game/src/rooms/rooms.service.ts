import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateTeamDto } from 'src/teams/dto/create-team.dto';
import { TeamsService } from 'src/teams/teams.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RoomsService {
  private readonly MAX_USERS_IN_ROOM = 9;

  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createRoomDto: CreateRoomDto) {
    const createdRoom = new this.roomModel(createRoomDto);
    try {
      return await createdRoom.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Room with name ${createRoomDto.name} already exists`,
        );
      }
      throw new InternalServerErrorException('Could not create room');
    }
  }

  async findAll() {
    return await this.roomModel.find().exec();
  }

  async findOne(id: Types.ObjectId): Promise<RoomDocument> {
    this.validateId(id);
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} is not found`);
    }
    return room;
  }

  async update(id: Types.ObjectId, updateRoomDto: UpdateRoomDto) {
    this.validateId(id);
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();
    if (!updatedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return updatedRoom;
  }

  // Delete the room
  // api/v1/rooms/:roomId
  async delete(id: Types.ObjectId) {
    this.validateId(id);
    const deletedRoom = await this.roomModel.findByIdAndDelete(id).exec();
    if (!deletedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  private validateId(id: Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Invalid ID');
  }

  /**
   * Finds the first available room with less than the maximum allowed users.
   * @returns {Promise<RoomDocument | null>} - The first available room or null if none is found.
   */
  async findFirstAvailableRoom(): Promise<RoomDocument | null> {
    return this.roomModel
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
    const { deletedCount } = await this.roomModel.deleteMany({}).exec();
    return {
      message:
        deletedCount > 0
          ? `Successfully deleted ${deletedCount} rooms.`
          : 'No rooms found to delete.',
    };
  }

  async calculateScores(roomId: Types.ObjectId): Promise<{ message: string }> {
    const teams = await this.teamsService.findAll(roomId);

    for (const team of teams) {
      if (team.success) {
        team.teamScore += 20;

        for (const playerId of team.players) {
          await this.usersService.incrementScore(playerId, 10);
        }

        await team.save();
      }
    }

    return { message: 'Scores calculated successfully!' };
  }
}
