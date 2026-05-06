import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/application/users.service';
import { LoginDto } from '../interface/dto/login.dto';
import { RegisterDto } from '../interface/dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.signAccess(payload);
    const refreshToken = this.signRefresh(user.id);

    const { password: _pw, ...userResult } = user;
    return { user: userResult, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; type: string }>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user?.isActive) {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }

      const accessToken = this.signAccess({ sub: user.id, email: user.email });
      return { accessToken };
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async validateUser(payload: { sub: string; email: string }) {
    return this.usersService.findOne(payload.sub);
  }

  private signAccess(payload: { sub: string; email: string }): string {
    const options: any = {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
    };
    return this.jwtService.sign(payload, options as JwtSignOptions);
  }

  private signRefresh(userId: string): string {
    const options: any = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    };
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      options as JwtSignOptions,
    );
  }
}
