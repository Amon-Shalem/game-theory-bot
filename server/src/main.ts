import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { AIExceptionFilter } from './common/ai-exception.filter'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new AIExceptionFilter())
  app.enableCors({ origin: 'http://localhost:5173' })

  await app.listen(3000)
  console.log('Server running on http://localhost:3000')
}

bootstrap()
