import {
  Controller,
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
  ApiConsumes,
} from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

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

class RankFilterDto {
  @ApiProperty({
    description: 'Minimum rank to filter products by',
    example: 1,
  })
  @IsNumber()
  minRank: number;
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

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
  @ApiConsumes('text/plain')
  transformUpcs(@Body('upc') upc: string): string {
    const transformedUpcString = this.convertUpcStringsToList(upc);
    if (transformedUpcString.length === 0) {
      throw new BadRequestException('No valid UPCs found.');
    }
    return transformedUpcString;
  }

  @Post('fetch-filtered-products-by-upcs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch product data by UPCs and filter by minimum rank',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered product data retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiBody({ type: UpcsDto })
  async fetchFilteredProducts(
    @Body() upcsDto: UpcsDto,
    @Body() rankFilterDto: RankFilterDto,
  ) {
    const products = await this.catalogService.fetchProductData(upcsDto.upcs);
    const filteredProducts = this.catalogService.filterProductsByRank(
      products,
      rankFilterDto.minRank,
    );

    if (filteredProducts.length === 0) {
      return {
        message: 'No products found with the specified minimum rank.',
        upcRanks: this.catalogService.extractUpcRanks(products),
      };
    }

    return filteredProducts;
  }

  private convertUpcStringsToList(upcString: string): string {
    return upcString.replace(/\s+/g, ' ').trim();
  }
}
