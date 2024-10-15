import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from '../rooms.controller';
import { RoomsService } from '../rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { Types } from 'mongoose';
import { UpdateRoomDto } from '../dto/update-room.dto';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoomsService = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    deleteAllRooms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  describe('create', () => {
    it('should call create with correct data', async () => {
      const createRoomDto: CreateRoomDto = {
        name: 'New Room',
        teams: [],
        turnTime: 60,
      };

      mockRoomsService.create.mockResolvedValue(createRoomDto);

      await controller.create(createRoomDto);

      expect(service.create).toHaveBeenCalledWith(createRoomDto);
    });
  });

  describe('update', () => {
    it('should call update with correct data', async () => {
      const id = new Types.ObjectId();
      const updateRoomDto: UpdateRoomDto = {
        joinedUsers: [
          '6703ffd7ba4a6b1dcf6095e6',
          '6703fff1ba4a6b1dcf609705',
        ] as unknown as Types.ObjectId[],
      };
      mockRoomsService.update.mockResolvedValue(updateRoomDto);

      await controller.update(id, updateRoomDto);

      expect(service.update).toHaveBeenCalledWith(id, updateRoomDto);
    });
  });

  describe('findAll', () => {
    it('should call findAll and return rooms', async () => {
      const rooms = [
        {
          _id: '6703ffc8ba4a6b1dcf6095d1',
          name: 'New Room',
          joinedUsers: [],
          teams: [],
          turnTime: 60,
        },
        {
          _id: '6703ffc8ba4a6b1dcf6095dc',
          name: 'New Room',
          joinedUsers: [],
          teams: [],
          turnTime: 60,
        },
      ];

      mockRoomsService.findAll.mockResolvedValue(rooms);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(rooms);
    });
  });

  describe('findOne', () => {
    it('should call findOne with correct ID', async () => {
      const id = '6703ffc8ba4a6b1dcf6095d1' as unknown as Types.ObjectId;
      const room = {
        _id: '6703ffc8ba4a6b1dcf6095d1',
        name: 'New Room',
        joinedUsers: [],
        teams: [],
        turnTime: 60,
      };

      mockRoomsService.findOne.mockResolvedValue(room);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(room);
    });
  });

  describe('delete', () => {
    it('should call delete with correct ID', async () => {
      const id = '6703ffc8ba4a6b1dcf6095d1' as unknown as Types.ObjectId;
      mockRoomsService.delete.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(service.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteAllRooms', () => {
    it('should call deleteAllRooms and return a success message', async () => {
      const response = { message: 'Successfully deleted 2 rooms.' };
      mockRoomsService.deleteAllRooms.mockResolvedValue(response);

      const result = await controller.deleteAllRooms();

      expect(service.deleteAllRooms).toHaveBeenCalled();
      expect(result).toEqual(response);
    });
  });
});
