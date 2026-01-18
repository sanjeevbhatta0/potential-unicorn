import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { SourcesModule } from './sources/sources.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AISettingsModule } from './ai-settings/ai-settings.module';
import { BusinessModule } from './business/business.module';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl')
          ? {
            rejectUnauthorized: false,
          }
          : false,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    ArticlesModule,
    SourcesModule,
    UsersModule,
    AuthModule,
    AISettingsModule,
    BusinessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
