export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  images: string[];
  thumbnail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  token: string;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}