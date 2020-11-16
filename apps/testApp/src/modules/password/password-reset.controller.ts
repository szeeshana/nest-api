import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { PasswordResetService } from './password-reset.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post()
  async addPasswordReset(@Body() body: {}): Promise<ResponseFormat> {
    const response = await this.passwordResetService.addPasswordReset(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllPasswordResets(): Promise<ResponseFormat> {
    const options = {};
    const passwordResets = await this.passwordResetService.getPasswordResets(
      options,
    );
    return ResponseFormatService.responseOk(passwordResets, 'All');
  }

  @Get(':resetCode')
  async getPasswordReset(
    @Param('resetCode') resetCode: string,
  ): Promise<ResponseFormat> {
    const passwortReset = await this.passwordResetService.getPasswordResets({
      resetCode: resetCode,
    });
    return ResponseFormatService.responseOk(passwortReset, '');
  }

  @Patch(':id')
  async updatePasswordReset(
    @Param('id') id: string,
    @Body() body: {},
  ): Promise<ResponseFormat> {
    const updateResponse = await this.passwordResetService.updatePasswordReset(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateResponse, '');
  }

  @Delete(':id')
  async removePasswordReset(@Param('id') id: string): Promise<ResponseFormat> {
    const deleteResponse = await this.passwordResetService.deletePasswordReset({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteResponse, '');
  }
}
