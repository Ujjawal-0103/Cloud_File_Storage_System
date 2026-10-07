import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ActivityType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    if (this.prisma.activityLog?.create) {
      try {
        await this.prisma.activityLog.create({
          data: {
            action: ActivityType.REGISTER,
            userId: user.id,
          },
        });
      } catch (e) {
        this.logger.warn('Failed to log register activity', e);
      }
    }

    const { password, refreshToken, resetPasswordToken, resetPasswordExpires, ...result } = user;

    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    // 1. Generate short-lived access token
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });

    // 2. Generate longer-lived refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: jwtConstants.secret,
    });

    // 3. Hash and store refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    if (this.prisma.activityLog?.create) {
      try {
        await this.prisma.activityLog.create({
          data: {
            action: ActivityType.LOGIN,
            userId: user.id,
          },
        });
      } catch (e) {
        this.logger.warn('Failed to log login activity', e);
      }
    }

    const { password, refreshToken: _rt, resetPasswordToken, resetPasswordExpires, ...result } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: result,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token revoked or invalid');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token rotation: generate new access token and new refresh token
    const newPayload = {
      sub: user.id,
      email: user.email,
    };

    const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '1d' });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: '7d',
      secret: jwtConstants.secret,
    });

    const newHashed = await bcrypt.hash(newRefreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashed },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());

    const maskedEmail = email && email.includes('@')
      ? `${email.split('@')[0][0]}***@${email.split('@')[1]}`
      : '***';

    this.logger.log(
      `Forgot password requested for: ${maskedEmail} (Account exists: ${Boolean(user)})`,
    );

    if (user) {
      // Generate cryptographically secure random reset token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      // 1 hour expiry
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expires,
        },
      });

      this.logger.log(`Reset token securely stored for ${maskedEmail}`);

      // Securely dispatch password reset email via Resend
      if (this.mailService) {
        try {
          const result = await this.mailService.sendPasswordResetEmail(
            user.email,
            user.name,
            rawToken,
          );
          if (!result.success) {
            this.logger.warn(
              `Password reset email delivery returned unconfirmed: ${result.error}`,
            );
          }
        } catch (e: any) {
          this.logger.error('Failed to dispatch password recovery email', e?.message);
        }
      }
    }

    // Always return generic success message to prevent user enumeration
    return {
      message:
        'If an account exists with that email address, password reset instructions have been generated.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or has expired',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Invalidate reset token and any existing refresh tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null,
      },
    });

    return {
      message: 'Password has been reset successfully. You may now log in.',
    };
  }

  getGoogleAuthUrl(state?: string): string {
    const clientId =
      this.configService?.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID;
    const callbackUrl =
      this.configService?.get<string>('GOOGLE_CALLBACK_URL') ||
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/api/auth/google/callback';

    if (!clientId) {
      const frontendUrl = (
        this.configService?.get<string>('FRONTEND_URL') ||
        process.env.FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');
      return `${frontendUrl}/login?error=${encodeURIComponent(
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env',
      )}`;
    }

    const oauthState = state || crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'consent',
      state: oauthState,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string) {
    const clientId =
      this.configService?.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      this.configService?.get<string>('GOOGLE_CLIENT_SECRET') ||
      process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      this.configService?.get<string>('GOOGLE_CALLBACK_URL') ||
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Google OAuth credentials not configured on server',
      );
    }

    // 1. Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      this.logger.error(`Google token exchange failed: ${errText}`);
      throw new UnauthorizedException('Failed to exchange authorization code with Google');
    }

    const tokenData = await tokenResponse.json();
    const googleAccessToken = tokenData.access_token;
    const googleIdToken = tokenData.id_token;

    // Validate ID Token claims (issuer, audience, expiry)
    if (googleIdToken) {
      try {
        const parts = googleIdToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64url').toString('utf8'),
          );
          const validIssuers = [
            'https://accounts.google.com',
            'accounts.google.com',
          ];
          if (payload.iss && !validIssuers.includes(payload.iss)) {
            throw new UnauthorizedException('Invalid Google ID token issuer');
          }
          if (payload.aud && payload.aud !== clientId) {
            throw new UnauthorizedException('Google ID token audience mismatch');
          }
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            throw new UnauthorizedException('Google ID token has expired');
          }
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        this.logger.warn(`Failed to inspect Google id_token claims: ${err.message}`);
      }
    }

    // 2. Fetch user profile from Google
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      },
    );

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Failed to retrieve user profile from Google');
    }

    const profile = await profileResponse.json();
    const { sub: googleId, email, name, picture, email_verified } = profile;

    if (!email || !googleId) {
      throw new BadRequestException('Incomplete profile received from Google');
    }

    if (email_verified === false) {
      throw new BadRequestException('Google email address is not verified');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find existing account by Google provider identity
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId: googleId,
        },
      },
      include: { user: true },
    });

    let user: any = account?.user;

    if (!user) {
      // 4. Check if an account already exists with this email (Account Linking)
      user = await this.usersService.findByEmail(normalizedEmail);

      if (user) {
        // Safe Account Linking: Link Google provider identity to existing user
        await this.prisma.account.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerId: googleId,
          },
        });

        // If user doesn't have an avatar, set from Google profile
        if (!user.avatar && picture) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { avatar: picture },
          });
        }
      } else {
        // 5. Create brand new user with linked Google account
        const displayName = name || normalizedEmail.split('@')[0];
        user = await this.prisma.user.create({
          data: {
            name: displayName,
            email: normalizedEmail,
            avatar: picture || null,
            provider: 'google',
            accounts: {
              create: {
                provider: 'google',
                providerId: googleId,
              },
            },
          },
        });

        if (this.prisma.activityLog?.create) {
          try {
            await this.prisma.activityLog.create({
              data: {
                action: ActivityType.REGISTER,
                userId: user.id,
              },
            });
          } catch (e) {
            this.logger.warn('Failed to log register activity for Google user', e);
          }
        }
      }
    }

    // 6. Generate application JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: jwtConstants.secret,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    if (this.prisma.activityLog?.create) {
      try {
        await this.prisma.activityLog.create({
          data: {
            action: ActivityType.LOGIN,
            userId: user.id,
          },
        });
      } catch (e) {
        this.logger.warn('Failed to log login activity for Google user', e);
      }
    }

    const {
      password: _p,
      refreshToken: _rt,
      resetPasswordToken: _rpt,
      resetPasswordExpires: _rpe,
      ...result
    } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: result,
    };
  }
}