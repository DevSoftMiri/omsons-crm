import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.authService.setCookies(response, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Post("refresh")
  @Public()
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(dto.refreshToken || request.cookies?.omsons_refresh_token || "");
    this.authService.setCookies(response, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Get("me")
  async me(@Req() request: Request) {
    const session = (request as Request & { user?: { sub?: string } }).user;
    if (!session?.sub) return null;
    const user = await this.authService.getCurrentUser(session.sub);
    return user;
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(request.cookies?.omsons_refresh_token);
    response.clearCookie("omsons_access_token", { path: "/" });
    response.clearCookie("omsons_refresh_token", { path: "/" });
    return { ok: true };
  }
}
