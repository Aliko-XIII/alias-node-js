import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ParseObjectIdPipe } from 'src/parse-id.pipe';
import { Types } from 'mongoose';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Get()
  async findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.delete(id);
  }
  /**
   * Endpoint to calculate the scores for all teams and players in a specific room.
   * This method handles PATCH requests to the URL '/rooms/:roomId/calculate-scores'.
   *
   * @param {Types.ObjectId} roomId - The ID of the room for which scores will be calculated.
   * @returns {Promise<{ message: string }>} - A message indicating the success of the operation.
   */
  @Patch(':roomId/calculate-scores')
  async calculateScores(
    @Param('roomId', ParseObjectIdPipe) roomId: Types.ObjectId,
  ) {
    return this.roomsService.calculateScores(roomId);
  }

  @Delete()
  async deleteAllRooms(): Promise<{ message: string }> {
    return this.roomsService.deleteAllRooms();
  }
}
