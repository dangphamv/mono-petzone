import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() body: any) {
    return this.ordersService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for current user' })
  @ApiResponse({ status: 200, description: 'Orders list returned' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details returned' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.updateStatus(id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 201, description: 'Order cancelled successfully' })
  cancel(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.cancel(id, body);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  @ApiResponse({ status: 200, description: 'Order history returned' })
  getHistory(@Param('id') id: string) {
    return this.ordersService.getHistory(id);
  }
}
