import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { UsersService } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ParseObjectIdPipe } from '../parse-id.pipe';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';

// TeamsController manages CRUD operations for teams within a specified room.
@UseGuards(AuthGuard)
@Controller('rooms/:roomId/teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * @route POST /api/v1/rooms/{roomId}/teams
   * @description Create a new team in the specified room
   * @access Private (Authenticated user)
   */
  @Post()
  create(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.create(roomId, createTeamDto);
  }

  /**
   * @route GET /api/v1/rooms/{roomId}/teams
   * @description Retrieve all teams in the specified room
   * @access Private (Authenticated user)
   */
  @Get()
  findAllTeams(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Query('nestUsers') nestUsers: boolean = false,
  ) {
    return this.teamsService.findAll(roomId, nestUsers);
  }

  /**
   * @route DELETE /api/v1/rooms/{roomId}/teams
   * @description Delete all teams from the specified room
   * @access Private (Authenticated user)
   */
  @Delete()
  async deleteAllTeams(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
  ): Promise<{ message: string }> {
    return await this.teamsService.deleteAllTeamsFromRoom(roomId);
  }

  /**
   * @route GET /api/v1/rooms/{roomId}/teams/{teamId}
   * @description Retrieve a specific team by its ID in the specified room
   * @access Private (Authenticated user)
   */
  @Get(':teamId')
  findOneTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.findOne(roomId, teamId);
  }

  /**
   * @route PUT /api/v1/rooms/{roomId}/teams/{teamId}
   * @description Update a specific team by its ID in the specified room
   * @access Private (Authenticated user)
   */
  @Put(':teamId')
  updateTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(teamId, updateTeamDto);
  }

  /**
   * @route DELETE /api/v1/rooms/{roomId}/teams/{teamId}
   * @description Remove a specific team by its ID from the specified room
   * @access Private (Authenticated user)
   */
  @Delete(':teamId')
  removeTeam(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.remove(roomId, teamId);
  }

  /**
   * @route GET /api/v1/rooms/{roomId}/teams/{teamId}/players
   * @description Retrieve all players in the specified team
   * @access Private (Authenticated user)
   */
  @Get(':teamId/players')
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

    return players.sort((a, b) => Number(b.score) - Number(a.score));
  }

  /**
   * @route POST /api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}
   * @description Add a specific player to the specified team
   * @access Private (Authenticated user)
   */
  @Post(':teamId/players/:userId')
  addPlayer(
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.teamsService.addPlayerToTeam(userId, teamId);
  }

  /**
   * @route DELETE /api/v1/rooms/{roomId}/teams/{teamId}/players/{userId}
   * @description Remove a specific player from the specified team in the specified room
   * @access Private (Authenticated user)
   */
  @Delete(':teamId/players/:userId')
  removePlayer(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.teamsService.removePlayer(roomId, teamId, userId);
  }

  /**
   * @route PUT /api/v1/rooms/{roomId}/teams/{teamId}/roles
   * @description Define a describer and a leader for the specified team in the specified room
   * @access Private (Authenticated user)
   */
  @Put(':teamId/roles')
  defineDescriberAndLeader(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.defineDescriberAndLeader(roomId, teamId);
  }

  /**
   * @route PUT /api/v1/rooms/{roomId}/teams/{teamId}/reset
   * @description Reset the round fields for the specified team in the specified room to null
   * @access Private (Authenticated user)
   */
  @Put(':teamId/reset')
  resetRound(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return this.teamsService.resetRound(roomId, teamId);
  }

  /**
   * @route PUT /api/v1/rooms/{roomId}/teams/{teamId}/calculate-scores
   * @description Calculate and update scores for the specified team
   * @access Private (Authenticated user)
   */
  @Put(':teamId/calculate-scores')
  async calculateScores(
    @Param('teamId', ParseObjectIdPipe) teamId: Types.ObjectId,
  ) {
    return await this.teamsService.calculateScores(teamId);
  }
}
