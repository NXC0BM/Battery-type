from pathlib import Path
p=Path('C:/Web/Battery-type-lab3/battery-runtime-backend/src/battery_type/battery_type.service.ts');s=p.read_text(encoding='utf-8')
s=s.replace('      isMine: entity.creator?.id === this.currentUserId() ? 1 : 0,','      isMine: entity.creator?.id === this.currentUserId() ? 1 : 0,\n      isLiked: 0,')
s=s.replace('      isMine: row.creatorId === this.currentUserId() ? 1 : 0,','      isMine: row.creatorId === this.currentUserId() ? 1 : 0,\n      isLiked: await this.likeRepository.exists({where:{user:{id:this.currentUserId()},battery_type:{id:row.id}}}) ? 1 : 0,')
s=s.replace('    const existing = await this.likeRepository.findOne({','    if (!await this.battery_typeRepository.findOneBy({id:battery_typeId,status:BatteryTypeStatus.PUBLISHED})) throw new NotFoundException();\n    const existing = await this.likeRepository.findOne({')
p.write_text(s,encoding='utf-8')
p=Path('C:/Web/Battery-type-lab3/battery-runtime-backend/src/battery_type/dto/battery_type-response.dto.ts');s=p.read_text(encoding='utf-8').replace('  isMine:', '  isLiked: number;\n  isMine:');p.write_text(s,encoding='utf-8')
# Distinct likes at DB level for historical API too.
p=Path('C:/Web/Battery-type-lab3/battery-runtime-backend/src/likes/like.entity.ts');s=p.read_text(encoding='utf-8').replace('JoinColumn }','JoinColumn, Unique }').replace("@Entity('likes')","@Entity('likes')\n@Unique(['user', 'battery_type'])");p.write_text(s,encoding='utf-8')
# Explicitly mark legacy schema synchronization as obsolete in final backend.
p=Path('battery-runtime-backend/scripts/migrate.ts');p.write_text("throw new Error('Используйте npm run migrate: SQL-миграции сохраняют значения. synchronize здесь запрещён.');\n",encoding='utf-8')
p=Path('battery-runtime-backend/.env.example');s=p.read_text(encoding='utf-8').replace('PORT=3000','PORT=53000');p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-backend/src/main.ts');s=p.read_text(encoding='utf-8').replace("console.log('Battery Runtime REST API запущен на порту 3000 (проверяй по IP из hostname -I)');","console.log(`battery_type API: http://127.0.0.1:${process.env.PORT || 3000}/api/docs`);");p.write_text(s,encoding='utf-8')
