import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'johndoe', minLength: 3, maxLength: 40 })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username!: string;

  @ApiProperty({ example: 'susiairtest', minLength: 6, maxLength: 80 })
  @IsString()
  @MinLength(6)
  @MaxLength(80)
  password!: string;
}
