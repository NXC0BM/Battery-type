import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход — создаёт сессию и куку' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const user = await this.authService.validateUser(dto.username, dto.password);
    req.session.userId = user.id;
    return { id: user.id };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Выход — удаляет сессию' })
  async logout(@Req() req: any) {
    return new Promise((resolve) => {
      req.session.destroy(() => resolve({ ok: true }));
    });
  }
}
