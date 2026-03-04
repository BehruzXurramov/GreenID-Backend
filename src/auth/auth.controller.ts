import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';

type RequestWithUser = Request & { user: User };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() request: RequestWithUser, @Res() res: Response) {
    const { accessToken, user } = this.authService.login(request.user);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      accessToken,
      user: JSON.stringify(user),
    });

    return res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
  }
}
