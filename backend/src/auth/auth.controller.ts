import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

export interface CurrentUser {
  id: string;
  email: string;
}

@ApiTags('Authentication')
@Throttle({ auth: { limit: 20, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and acquire tokens' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke active refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: CurrentUser) {
    return this.authService.logout(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link for user email' })
  @ApiResponse({ status: 200, description: 'Reset instructions dispatched if account exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user auth profile' })
  getProfile(@CurrentUser() user: CurrentUser) {
    return user;
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth(@Res() res: Response) {
    const state = crypto.randomBytes(24).toString('hex');
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    const url = this.authService.getGoogleAuthUrl(state);
    return res.redirect(url);
  }

  @Get('google/url')
  @ApiOperation({ summary: 'Get Google OAuth authorization URL' })
  getGoogleUrl() {
    return { url: this.authService.getGoogleAuthUrl() };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    // Parse cookies from headers
    const rawCookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      rawCookieHeader
        .split(';')
        .map((c) => c.trim().split('='))
        .filter(([k]) => Boolean(k))
        .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
    );

    const savedState = cookies['oauth_state'];
    // Clear oauth_state cookie on response
    res.clearCookie('oauth_state', { path: '/' });

    if (error || !code) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(error || 'Google login was cancelled')}`,
      );
    }

    if (savedState && state && savedState !== state) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(
          'Invalid OAuth state. Potential cross-site request forgery detected.',
        )}`,
      );
    }

    try {
      const result = await this.authService.handleGoogleCallback(code);

      res.cookie('auth_token', result.access_token, {
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      const params = new URLSearchParams({
        token: result.access_token,
        name: result.user.name || '',
        email: result.user.email || '',
      });

      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(
          err.message || 'Google authentication failed',
        )}`,
      );
    }
  }
}
