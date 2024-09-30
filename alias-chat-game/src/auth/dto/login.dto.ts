import {
  IsString,
  IsNotEmpty,
  Length,
  IsStrongPassword,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 20)
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password: string;
}
