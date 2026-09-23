import apiClient from "./client";
import { ProductsResponse, Product, Category } from "../types";

export async function getProducts(limit: number, skip: number): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>("/products", {
    params: { limit, skip },
  });
  return response.data;
}

export async function getProduct(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
}

export async function searchProducts(query: string, limit: number, skip: number): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>("/products/search", {
    params: { q: query, limit, skip },
  });
  return response.data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>("/products/categories");
  return response.data;
}

export async function getProductsByCategory(category: string, limit: number, skip: number): Promise<ProductsResponse> {
  const response = await apiClient.get<ProductsResponse>(`/products/category/${category}`, {
    params: { limit, skip },
  });
  return response.data;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const response = await apiClient.post<Product>("/products/add", data);
  return response.data;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const response = await apiClient.put<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}