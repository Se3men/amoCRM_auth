import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  constructor(private http: HttpService, private config: ConfigService) {
    this.authAmoLocal();
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
    try {
      const data = await this.doRequest({
        method: 'POST',
        url: `${this.config.get('AUTH_STRAPI_URL_PRODUCTION')}`,
        data: {
          identifier: `${this.config.get('STRAPI_LOGIN')}`,
          password: `${this.config.get('STRAPI_PASSWORD')}`,
        },
      });
      if (data.data) {
        return data.data;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  private async authAmoProd(): Promise<any> {
    try {
      const jwtBearerToken = await this.authStrapiProd();
      const data = await this.doRequest({
        headers: {
          Authorization: `Bearer ${jwtBearerToken.jwt}`,
        },
        method: 'GET',
        url: `${this.config.get('AMO_STRAPI_URL_PRODUCTION')}`,
      });
      if (data.data) {
        return data.data;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  private async authStrapiLocal(): Promise<any> {
    try {
      const data = await this.doRequest({
        method: 'POST',
        url: `${this.config.get('AUTH_STRAPI_URL_LOCAL')}`,
        data: {
          identifier: `${this.config.get('STRAPI_LOGIN')}`,
          password: `${this.config.get('STRAPI_PASSWORD')}`,
        },
      });
      if (data.data) {
        return data.data;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  private async authAmoLocal(): Promise<void> {
    try {
      const tokenLocal = await this.authStrapiLocal();
      const authData = await this.authAmoProd();
      await this.doRequest({
        headers: {
          Authorization: `Bearer ${tokenLocal.jwt}`,
        },
        method: 'PUT',
        url: `${this.config.get('AMO_STRAPI_URL_LOCAL')}`,
        data: {
          authData,
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
