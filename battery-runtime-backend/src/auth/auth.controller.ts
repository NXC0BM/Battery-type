import { Body, Controller, Post, Req, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('users')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход — создаёт сессию и куку' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const user = await this.authService.validateUser(dto.username, dto.password);
    await new Promise<void>((resolve, reject) => req.session.regenerate((err: Error) => err ? reject(err) : resolve()));
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save((err: Error) => err ? reject(err) : resolve()));
    return { id: user.id };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Выход — удаляет сессию' })
  async logout(@Req() req: any) {
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ ok: true }));
    });
  }
}
