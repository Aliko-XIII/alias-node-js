import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  @IsNotEmpty()
  roomId: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  @IsNotEmpty()
  teamId: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @IsString()
  @Length(3, 20)
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
