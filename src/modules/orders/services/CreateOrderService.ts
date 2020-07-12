import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not exists!');
    }

    const idsProducts = products.map(product => {
      return { id: product.id };
    });

    const productsOrder = await this.productsRepository.findAllById(
      idsProducts,
    );

    if (!productsOrder) {
      throw new AppError('Product id not exists!');
    }

    const productsFormate = productsOrder.map(product => {
      const productCurrent = products.find(prod => prod.id === product.id);

      if (productCurrent) {
        if (product.quantity < productCurrent?.quantity) {
          throw new AppError('Insufficient quantity');
        }
      }

      return {
        product_id: product.id,
        price: product.price,
        quantity: productCurrent?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsFormate,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
