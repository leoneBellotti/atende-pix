import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'Empresa e usuário criados com sucesso.' })
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post('login')
  @ApiOkResponse({ description: 'Login realizado com sucesso.' })
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }
}
