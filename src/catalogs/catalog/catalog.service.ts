import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CatalogService {
  private readonly baseUrl: string;
  private readonly marketplaceId: string;
  private readonly includedData: string;
  private readonly productData: any[] = []; // Replace with actual product data

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL');
    this.marketplaceId = this.configService.get<string>('MARKETPLACE_ID');
    this.includedData = this.configService.get<string>('INCLUDED_DATA');
  }

  private buildFetchUrl(upcs: string[]): string {
    const upcsParam = upcs.join(',');
    return `${this.baseUrl}?marketplaceIds=${this.marketplaceId}&includedData=${this.includedData}&identifiers=${upcsParam}&identifiersType=UPC`;
  }

  private chunkArray(array: any[], size: number): any[][] {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      chunkedArr.push(chunk);
    }
    return chunkedArr;
  }

  private async fetchWithRetry(
    url: string,
    options: AxiosRequestConfig,
    retries = 4,
    backoff = 500,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(url, options));
      return response.data;
    } catch (error) {
      if (retries > 0 && error.response && error.response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw new Error(`Error fetching data: ${error.message}`);
    }
  }

  public async fetchProductData(upcs: string[]): Promise<any[]> {
    const options: AxiosRequestConfig = {
      headers: {
        'x-amz-access-token': this.configService.get<string>('AMAZON_TOKEN'),
        'Content-Type': 'application/json',
      },
    };

    const upcsChunks = this.chunkArray(upcs, 10);
    const allResults = [];

    for (const chunk of upcsChunks) {
      const url = this.buildFetchUrl(chunk);
      try {
        const data = await this.fetchWithRetry(url, options);
        if (data && data.items) {
          allResults.push(...data.items);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        if (error.response) {
          const status = error.response.status;
          switch (status) {
            case 400:
              throw new BadRequestException('Bad request to the Amazon API.');
            case 401:
              throw new UnauthorizedException(
                'Unauthorized request to the Amazon API.',
              );
            case 403:
              throw new ForbiddenException(
                'Forbidden request to the Amazon API.',
              );
            default:
              throw new InternalServerErrorException(
                'An unexpected error occurred.',
              );
          }
        } else {
          throw new InternalServerErrorException(
            'Failed to reach the Amazon API.',
          );
        }
      }
    }

    return allResults;
  }

  public convertUpcStringsToList(upcString: string): string[] {
    return upcString
      .split(/\s+/)
      .map((upc) => upc.replace('-', ''))
      .filter((upc) => upc.length > 0);
  }

  public filterProductsByUpcs(products: any[], upcs: string[]): any[] {
    return products.filter((product) => {
      const upcIdentifiers = product.identifiers
        .filter((id) => id.identifierType === 'UPC')
        .map((id) => id.identifier);
      return upcIdentifiers.some((upc) => upcs.includes(upc));
    });
  }
}
