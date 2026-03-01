import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [AuthModule, TenantsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
