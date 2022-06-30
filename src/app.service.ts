import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(private http: HttpService, private config: ConfigService) {
    this.authStrapiProd();
  }

  private async doRequest<T = unknown>(
    config: AxiosRequestConfig<unknown>,
  ): Promise<AxiosResponse<T>> {
    const strapiAuthConfig: AxiosRequestConfig = {
      headers: {
        'Content-type': 'application/json',
      },
    };
    const httpObservable = this.http.request({
      ...strapiAuthConfig,
      ...config,
    });
    const httpResponse = await lastValueFrom(httpObservable);
    return httpResponse;
  }

  private async authStrapiProd(): Promise<any> {
    const data = await this.doRequest({
      method: 'POST',
      url: `${this.config.get('AUTH_STRAPI_URL_PRODUCTION')}`,
      data: {
        identifier: `${this.config.get('STRAPI_LOGIN')}`,
        password: `${this.config.get('STRAPI_PASSWORD')}`,
      },
    });
    return data.data;
  }

  private async authAmoProd(): Promise<any> {
    const jwtBearerToken = await this.authStrapiProd();
    const data = await this.doRequest({
      headers: {
        Authorization: `Bearer ${jwtBearerToken.jwt}`,
      },
      method: 'GET',
      url: `${this.config.get('AMO_STRAPI_URL_PRODUCTION')}`,
    });
    return data.data;
  }

  private async authStrapiLocal(): Promise<any> {
    const data = await this.doRequest({
      method: 'POST',
      url: `${this.config.get('AUTH_STRAPI_URL_LOCAL')}`,
      data: {
        identifier: `${this.config.get('STRAPI_LOGIN')}`,
        password: `${this.config.get('STRAPI_PASSWORD')}`,
      },
    });
    return data.data;
  }

  private async authAmoLocal(): Promise<void> {
    const tokenLocal = await this.authStrapiLocal();
    const authData = await this.authAmoProd();
    const data = await this.doRequest({
      headers: {
        Authorization: `Bearer ${tokenLocal.jwt}`,
      },
      method: 'PUT',
      url: `${this.config.get('AMO_STRAPI_URL_LOCAL')}`,
      data: {
        authData,
      },
    });
  }
}
