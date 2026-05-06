import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token nhận được sau khi đăng nhập' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
