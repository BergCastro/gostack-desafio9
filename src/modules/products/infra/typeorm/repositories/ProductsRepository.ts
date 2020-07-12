import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: { name },
    });
    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    // console.log('CHEGOU AO PONTO B');

    const ids = products.map(prod => prod.id);
    const findProducts = await this.ormRepository.find({
      id: In(ids),
    });

    if (ids.length !== findProducts.length) {
      throw new AppError('Any product not existis');
    }

    // console.log('findedProducts', findProducts);
    // console.log('Products', products);

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const findProducts = await this.findAllById(products);

    const updatedProducts = findProducts.map(product => ({
      ...product,
      quantity:
        product.quantity -
        (products.find(({ id }) => id === product.id)?.quantity || 0),
    }));

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
