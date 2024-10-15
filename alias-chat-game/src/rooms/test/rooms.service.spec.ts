import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoomsService } from '../rooms.service';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TeamsService } from '../../teams/teams.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomModel: any;

  const mockRoom = {
    _id: new Types.ObjectId(),
    name: 'Test Room',
    joinedUsers: [],
    turnTime: 60,
  };

  const mockRoomModel = {
    create: jest.fn().mockResolvedValue(mockRoom),
    find: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue([mockRoom]) }),
    findOne: jest.fn(),
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRoom) }),
    findByIdAndUpdate: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRoom) }),
    findByIdAndDelete: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRoom) }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  const mockTeamsService = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getModelToken('Room'),
          useValue: mockRoomModel,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomModel = module.get(getModelToken('Room'));
  });

  describe('create', () => {
    it('should create and return a new room', async () => {
      const createRoomDto: CreateRoomDto = {
        name: 'New Room',
        teams: [],
        turnTime: 60,
      };

      const result = await service.create(createRoomDto);

      expect(roomModel.create).toHaveBeenCalledWith(createRoomDto);
      expect(result).toEqual(mockRoom);
    });

    it('should throw ConflictException if room name already exists', async () => {
      const createRoomDto: CreateRoomDto = {
        name: 'New Room',
        teams: [],
        turnTime: 60,
      };

      roomModel.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(createRoomDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createRoomDto)).rejects.toThrow(
        `Room with name ${createRoomDto.name} already exists`,
      );
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const createRoomDto: CreateRoomDto = {
        name: 'New Room',
        teams: [],
        turnTime: 60,
      };

      roomModel.create.mockRejectedValue(new Error('Some other error'));

      await expect(service.create(createRoomDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of rooms', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRoom]);
      expect(roomModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a room by id', async () => {
      const result = await service.findOne(mockRoom._id);
      expect(result).toEqual(mockRoom);
      expect(roomModel.findById).toHaveBeenCalledWith(mockRoom._id);
    });

    it('should throw NotFoundException if room is not found', async () => {
      roomModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne(mockRoom._id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(
        service.findOne('111' as unknown as Types.ObjectId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return the room', async () => {
      const updateRoomDto: UpdateRoomDto = {
        joinedUsers: [
          '6703ffd7ba4a6b1dcf6095e6',
          '6703fff1ba4a6b1dcf609705',
        ] as unknown as Types.ObjectId[],
      };

      roomModel.findByIdAndUpdate.mockResolvedValue(mockRoom);
      const result = await service.update(mockRoom._id, updateRoomDto);

      expect(result).toEqual(mockRoom);
      expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRoom._id,
        updateRoomDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if room is not found during update', async () => {
      roomModel.findByIdAndUpdate.mockResolvedValueOnce(null);
      await expect(
        service.update(mockRoom._id, {} as UpdateRoomDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(
        service.update('111' as unknown as Types.ObjectId, {} as UpdateRoomDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteById', () => {
    it('should delete the room and return nothing', async () => {
      roomModel.findByIdAndDelete.mockResolvedValue(mockRoom);

      await service.delete(mockRoom._id);

      expect(roomModel.findByIdAndDelete).toHaveBeenCalledWith(mockRoom._id);
    });

    it('should throw NotFoundException if room is not found', async () => {
      roomModel.findByIdAndDelete.mockResolvedValueOnce(null);

      await expect(service.delete(mockRoom._id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(
        service.delete('111' as unknown as Types.ObjectId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAllRooms', () => {
    it('should delete all rooms', async () => {
      const result = await service.deleteAllRooms();
      expect(result).toEqual({ message: 'Successfully deleted 1 rooms.' });
      expect(roomModel.deleteMany).toHaveBeenCalled();
    });
  });

  describe('updateTeam', () => {
    const roomId = new Types.ObjectId();
    const teamIds = [new Types.ObjectId(), new Types.ObjectId()];
    const mockUpdatedRoom = {
      ...mockRoom,
      teams: teamIds,
      save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      jest.clearAllMocks(); // Clear previous mocks
    });

    it('should add teams to the room and return the updated room', async () => {
      jest
        .spyOn(roomModel, 'findByIdAndUpdate')
        .mockResolvedValue(mockUpdatedRoom);

      const result = await service.updateTeam(roomId, teamIds);

      expect(result).toEqual(mockUpdatedRoom);
      expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        { $addToSet: { teams: { $each: teamIds } } },
        { new: true },
      );
    });
  });
});
