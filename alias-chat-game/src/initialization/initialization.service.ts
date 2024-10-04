import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateRoomDto } from 'src/rooms/dto/create-room.dto';
import { RoomsService } from 'src/rooms/rooms.service';
import { CreateTeamDto } from 'src/teams/dto/create-team.dto';
import { TeamsService } from 'src/teams/teams.service';

@Injectable()
export class InitializationService implements OnModuleInit {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly teamsService: TeamsService,
  ) {}

  /**
   * Lifecycle hook that is called when the module is initialized.
   * It triggers the creation of default rooms with teams.
   */
  async onModuleInit() {
    await this.createDefaultRooms();
  }

  /**
   * Creates default rooms if they do not already exist in the database.
   */
  private async createDefaultRooms() {
    await this.roomsService.deleteAllRooms();
    const initialRooms: CreateRoomDto[] = [
      { name: 'Room1', teams: [], turnTime: 60 },
      { name: 'Room2', teams: [], turnTime: 60 },
    ];

    for (const room of initialRooms) {
      const existingRoom = await this.roomsService.findAll();
      const roomExist = existingRoom.some(
        (existing) => existing.name === room.name,
      );

      if (!roomExist) {
        const createdRoom = await this.roomsService.create(room);
        await this.addTeamsToRoom(createdRoom._id);
      }
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

    await this.roomsService.updateTeam(roomId, teamIds);
  }
}
