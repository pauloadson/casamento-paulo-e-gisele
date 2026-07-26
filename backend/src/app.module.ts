import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GuestModule } from './guest/guest.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { GiftsModule } from './gifts/gifts.module';
import { SystemLogsModule } from './system-logs/system-logs.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, 
    SystemLogsModule,
    GuestModule,
    AuthModule,
    UsersModule,
    GiftsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminUsername && adminPassword) {
      const existingUser = await this.usersService.findOne(adminUsername);
      if (!existingUser) {
        await this.usersService.create(adminUsername, adminPassword);
        console.log(`Admin user '${adminUsername}' created from environment variables.`);
      } else {
        // Se o usuário já existir, garantir que a senha seja a do arquivo .env
        const isValid = await require('bcryptjs').compare(adminPassword, existingUser.password);
        if (!isValid) {
          await this.usersService.updatePassword(adminUsername, adminPassword);
          console.log(`Admin user '${adminUsername}' password updated from environment variables.`);
        }
      }
    }
  }
}
