import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@infrastructure/web/controllers/auth.controller';
import { ExternalAuthController } from '@infrastructure/web/controllers/external-auth.controller';
import { HealthController } from '@infrastructure/web/controllers/health.controller';
import { AuthService } from '@application/services/auth.service';
import { UserEntity } from '@infrastructure/database/entities/user.entity';
import { TypeOrmUserRepository } from '@infrastructure/database/repositories/typeorm-user.repository';

const USER_REPOSITORY = 'UserRepository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.AUTH_DB_HOST || 'localhost',
        port: parseInt(process.env.AUTH_DB_PORT) || 5433,
        username: process.env.AUTH_DB_USER || 'auth_user',
        password: process.env.AUTH_DB_PASS || 'auth_pass',
        database: process.env.AUTH_DB_NAME || 'auth_db',
        entities: [UserEntity],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController, ExternalAuthController, HealthController],
  providers: [
    AuthService,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
})
export class AppModule {}