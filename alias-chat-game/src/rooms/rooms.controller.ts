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
import { ParseObjectIdPipe } from '../parse-id.pipe';
import { Types } from 'mongoose';

/**
 * Controller for handling room-related requests.
 * Handles routes for creating, updating, retrieving, and deleting rooms.
 */
@Controller('rooms')
export class RoomsController {
  constructor(
    /**
     * Rooms service for handling business logic related to rooms.
     */
    private readonly roomsService: RoomsService,
  ) {}

  /**
   * @route POST /api/v1/rooms
   * @description Create a new room
   * @access Private (Authenticated user)
   */
  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  /**
   * @route PATCH /api/v1/rooms/{id}
   * @description Update a specific room by ID with new data
   * @access Private (Authenticated user)
   */
  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  /**
   * @route GET /api/v1/rooms
   * @description Retrieve a list of all rooms
   * @access Private (Authenticated user)
   */
  @Get()
  async findAll() {
    return this.roomsService.findAll();
  }

  /**
   * @route GET /api/v1/rooms/{id}
   * @description Retrieve details of a specific room by ID
   * @access Private (Authenticated user)
   */
  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.findOne(id);
  }

  /**
   * @route DELETE /api/v1/rooms/{id}
   * @description Delete a specific room by ID
   * @access Private (Authenticated user)
   */
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.roomsService.delete(id);
  }

  /**
   * @route DELETE /api/v1/rooms
   * @description Delete all rooms
   * @access Private (Authenticated user)
   */
  @Delete()
  async deleteAllRooms(): Promise<{ message: string }> {
    return this.roomsService.deleteAllRooms();
  }
}
