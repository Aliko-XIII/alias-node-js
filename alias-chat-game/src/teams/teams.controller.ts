import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { UsersService } from 'src/users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ParseObjectIdPipe } from 'src/parse-id.pipe';
import { Types } from 'mongoose';

@Controller('rooms/:roomId/teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
  ) { }

  // Add a team to a room
  @Post() // api/v1/rooms/{roomId}/teams
  create(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.create(roomId, createTeamDto);
  }

  // Get all teams in a room
  @Get() // api/v1/rooms/{roomId}/teams
  findAllTeams(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Query('nestUsers') nestUsers: boolean = false,
  ) {
    return this.teamsService.findAll(roomId, nestUsers);
  }

  // Deletes all teams from a specific room.
  @Delete() // /api/v1/rooms/{roomId}/teams
  async deleteAllTeams(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
  ): Promise<{ message: string }> {
    return await this.teamsService.deleteAllTeamsFromRoom(roomId);
  }

  // Get a specific team by ID
  @Get(':teamId') // api/v1/rooms/{roomId}/teams/{teamId}
  findOneTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.findOne(roomId, teamId);
  }

  // Update a team by ID
  @Put(':teamId') // api/v1/rooms/{roomId}/teams/{teamId}
  updateTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(teamId, updateTeamDto);
  }

  // Delete a team by ID
  @Delete(':teamId') // api/v1/rooms/{roomId}/teams/{teamId}
  removeTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.remove(roomId, teamId);
  }

  // Get all players in a team
  @Get(':teamId/players') // api/v1/rooms/{roomId}/teams/{teamId}/players
  async findAllTeamPlayers(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    const playerIds = await this.teamsService.findAllTeamPlayers(
      roomId,
      teamId,
    );

    const players = await Promise.all(
      playerIds.map(async (id: Types.ObjectId) => {
        const player = await this.usersService.getUserById(id);
        return player;
      }),
    );
    return players.sort((a, b) => b.score - a.score);
  }

  // Add a player to a team
  @Post(':teamId/players/:userId') // api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}
  addPlayer(
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.teamsService.addPlayerToTeam(userId, teamId);
  }

  // Remove a player from a team
  @Delete(':teamId') // /api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}
  removePlayer(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.teamsService.removePlayer(roomId, teamId, userId);
  }

  // Define a describer and leader in one round
  @Put(':teamId/roles') //api/v1/rooms/{roomId}/teams/{teamId}/roles
  defineDescriberAndLeader(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.defineDescriberAndLeader(roomId, teamId);
  }

  // Reset round fields to null
  @Put(':teamId/reset') // api/v1/rooms/{roomId}/teams/{teamId}/reset
  resetRound(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.resetRound(roomId, teamId);
  }
}
