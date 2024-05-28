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
  ApiProperty,
  ApiBody,
} from '@nestjs/swagger';
import { ApiPlainTextBody } from '../../decorators/plain-text.decorator';

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
  transformUpcs(@Body('upc') upc: string): string {
    const transformedUpcString = this.convertUpcStringsToList(upc);
    if (transformedUpcString.length === 0) {
      throw new BadRequestException('No valid UPCs found.');
    }
    return transformedUpcString;
  }

  private convertUpcStringsToList(upcString: string): string {
    return upcString.replace(/\s+/g, ' ').trim();
  }
}
