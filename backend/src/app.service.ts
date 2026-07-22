import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.log('Executando ping para manter o servidor acordado no Render...');
    
    // O Render fornece a variável RENDER_EXTERNAL_URL. Se não existir, usamos localhost.
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.API_KEY || ''
        }
      });
      
      if (response.ok) {
        this.logger.log(`Ping executado com sucesso: ${response.status}`);
      } else {
        this.logger.error(`Erro no ping: Status ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Falha ao tentar pingar o servidor', error);
    }
  }
}
