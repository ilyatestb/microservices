import { DynamicModule, Global, Module, Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongoClient, Db } from 'mongodb'

export const MONGODB_CLIENT = 'MONGODB_CLIENT'
export const MONGODB_DB = 'MONGODB_DB'

@Global()
@Module({})
export class MongodbModule {
  private static readonly logger = new Logger('MongodbModule')

  static forRoot(): DynamicModule {
    return {
      module: MongodbModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: MONGODB_CLIENT,
          inject: [ConfigService],
          useFactory: async (configService: ConfigService): Promise<MongoClient> => {
            const host = configService.get<string>('MONGODB_HOST', 'mongodb')
            const port = configService.get<number>('MONGODB_PORT', 27017)
            const user = configService.get<string>('MONGODB_USER', 'admin')
            const password = configService.get<string>('MONGODB_PASSWORD', 'secret')
            const database = configService.get<string>('MONGODB_DATABASE', 'test')

            const uri = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`

            this.logger.log(`Connecting to MongoDB at ${host}:${port}/${database}`)

            const client = new MongoClient(uri, {
              serverSelectionTimeoutMS: 10000,
              connectTimeoutMS: 10000,
            })

            return client
          },
        },
        {
          provide: MONGODB_DB,
          inject: [MONGODB_CLIENT, ConfigService],
          useFactory: async (client: MongoClient, configService: ConfigService): Promise<Db> => {
            const database = configService.get<string>('MONGODB_DATABASE', 'test')
            const db = client.db(database)

            try {
              await db.admin().ping()
              this.logger.log(`MongoDB database '${database}' is ready`)
            } catch (error) {
              this.logger.error(`Failed to ping database: ${error.message}`)
            }

            return db
          },
        },
      ],
      exports: [MONGODB_CLIENT, MONGODB_DB],
    }
  }
}
