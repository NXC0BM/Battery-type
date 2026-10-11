import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentUserProvider } from '../common/current-user.provider';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(username: string): Promise<UserResponseDto> {
    const user = this.userRepository.create({ username });
    const saved = await this.userRepository.save(user);
    return { id: saved.id, username: saved.username };
  }

  // Заглушка для ЛР4 — возвращает singleton-пользователя
  async login(): Promise<UserResponseDto> {
    const userId = CurrentUserProvider.getInstance().getCurrentUserId();
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return { id: user?.id ?? userId, username: user?.username ?? '' };
  }
}
