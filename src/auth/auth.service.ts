import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const name =
      profile.displayName?.trim() ||
      `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim();

    if (!googleId || !email || !name) {
      throw new UnauthorizedException('Invalid Google profile data');
    }

    const existingByGoogleId = await this.usersService.findByGoogleId(googleId);
    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    const existingByEmail = await this.usersService.findByEmail(email);
    if (existingByEmail) {
      if (existingByEmail.googleId !== googleId) {
        throw new UnauthorizedException(
          'Email is already linked to another account',
        );
      }
      return existingByEmail;
    }

    return this.usersService.createFromGoogle({
      googleId,
      email,
      name,
    });
  }

  login(user: User): AuthResponseDto {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.usersService.toResponseDto(user),
    };
  }
}
