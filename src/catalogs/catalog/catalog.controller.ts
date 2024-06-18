import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiPlainTextBody } from 'src/decorators/plain-text.decorator';
import { getWalmartProducts, WalmartProduct } from '../../webscrapper/scrapper';
import { searchAmazonByUPC } from '../../webscrapper/amazonSearch';

class UpcStringDto {
  @ApiProperty({
    description: 'UPC',
    example: '123456789012 123456789013 1237476789013',
  })
  upc: string;
}

class UpcsDto {
  @ApiProperty({
    description: 'Array of UPCs',
    example: ['123456789012', '123456789013'],
  })
  upcs: string[];
}

export class RawTextDto {
  @ApiProperty({
    description: 'Raw text input, each UPC on a new line.',
    example: `35406-03324
615908426328
796845691977
615908420821
792486906111`,
    type: 'string',
    format: 'textarea',
  })
  @IsString()
  upc: string;
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('scrape-walmart')
  @HttpCode(HttpStatus.OK)
  async scrapeWalmart(@Body('query') query: string): Promise<WalmartProduct[]> {
    try {
      const products = await getWalmartProducts(query);
      return products;
    } catch (error) {
      console.error('Error in scrapeWalmart endpoint:', error);
      throw new BadRequestException('Error scraping Walmart');
    }
  }

  @Post('search-amazon')
  @HttpCode(HttpStatus.OK)
  async searchAmazon(@Body('upc') upc: string) {
    try {
      const products = await searchAmazonByUPC(upc);
      return products;
    } catch (error) {
      console.error('Error in searchAmazon endpoint:', error);
      throw new BadRequestException('Error searching Amazon');
    }
  }

  @Post('fetch-products-by-upcs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch product data by UPCs' })
  @ApiResponse({
    status: 200,
    description: 'Product data retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiBody({ type: UpcsDto })
  async fetchProducts(@Body() upcsDto: UpcsDto) {
    return this.catalogService.fetchProductData(upcsDto.upcs);
  }

  @Post('convert-upc-string-to-array')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert UPC string to array' })
  @ApiResponse({
    status: 200,
    description: 'UPC string converted to array successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiBody({ type: UpcStringDto })
  convertUpcStringToArray(@Body() upcStringDto: UpcStringDto) {
    return this.catalogService.convertUpcStringsToList(upcStringDto.upc);
  }

  @Post('transform-upcs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transform multi-line UPC input to space-separated string',
  })
  @ApiResponse({
    status: 200,
    description: 'UPC string transformed successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiPlainTextBody()
  async transformUpcs(@Body('upc') upc: string): Promise<any> {
    if (typeof upc !== 'string') {
      throw new BadRequestException('Input must be a string.');
    }

    const transformedUpcList = this.catalogService.convertUpcStringsToList(upc);
    if (transformedUpcList.length === 0) {
      throw new BadRequestException('No valid UPCs found.');
    }

    const data = await this.catalogService.fetchProductData(transformedUpcList);
    if (!data || data.length === 0) {
      throw new BadRequestException('No data found for the provided UPCs.');
    }

    const filteredProducts = this.catalogService.filterProductsByUpcs(
      data,
      transformedUpcList,
    );

    const result = filteredProducts.map((product) => ({
      asin: product.asin,
      cost: product.attributes?.list_price?.[0]?.value || 'N/A',
    }));

    console.log('Filtered Products:', result);

    return result;
  }
}
