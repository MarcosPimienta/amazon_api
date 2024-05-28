import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiPlainTextBody } from 'src/decorators/plain-text.decorator';

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
  @ApiQuery({
    name: 'minRank',
    required: false,
    type: Number,
    description: 'Minimum rank for filtering',
  })
  @ApiQuery({
    name: 'maxRank',
    required: false,
    type: Number,
    description: 'Maximum rank for filtering',
  })
  transformUpcs(
    @Body('upc') upc: string,
    @Query('minRank') minRank?: number,
    @Query('maxRank') maxRank?: number,
  ): any {
    if (typeof upc !== 'string') {
      throw new BadRequestException('Input must be a string.');
    }

    const transformedUpcString = this.convertUpcStringsToList(upc);
    if (transformedUpcString.length === 0) {
      throw new BadRequestException('No valid UPCs found.');
    }

    // Perform filtering based on rank
    const filteredData = this.filterByRank(
      transformedUpcString,
      minRank,
      maxRank,
    );

    return filteredData;
  }

  private convertUpcStringsToList(upcString: string): string {
    if (typeof upcString !== 'string') {
      throw new BadRequestException('Input must be a string.');
    }
    return upcString.replace(/\s+/g, ' ').trim();
  }

  private async filterByRank(
    upcs: string,
    minRank?: number,
    maxRank?: number,
  ): Promise<any> {
    const data = this.catalogService.getDataByUpcs(upcs.split(' ')); // Assuming getDataByUpcs fetches data for given UPCs

    if (!data) {
      throw new BadRequestException('No data found for the provided UPCs.');
    }

    return (await data).filter((item) => {
      const rank = item.salesRanks?.[0]?.classificationRanks?.[0]?.rank || Infinity;
      return (
        (minRank === undefined || rank >= minRank) &&
        (maxRank === undefined || rank <= maxRank)
      );
    });
  }
}
