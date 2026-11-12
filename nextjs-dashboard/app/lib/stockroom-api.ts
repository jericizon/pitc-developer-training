export type ProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  status: ProductStatus;
};

export type ProductInput = Pick<Product, 'name' | 'sku' | 'category' | 'price' | 'quantity'>;

export type ProductFilter = { search?: string; category?: string; status?: ProductStatus | '' };

export type Activity = {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  productId: string;
  productName: string;
  detail: string | null;
  at: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api<T>(
  path: string,
  { method, body, signal }: { method?: string; body?: ProductInput; signal?: AbortSignal } = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      body: body && JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'AbortError') throw err;
    if (name === 'TimeoutError') throw new Error('The server took too long to respond.');
    throw new Error('Cannot reach the server. Is it running?');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  return json.data as T;
}

export function fetchProducts({ search, category, status }: ProductFilter, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  return api<Product[]>(`/products?${params}`, { signal });
}

export function fetchActivity() {
  return api<Activity[]>('/activity');
}

export function fetchProduct(id: string) {
  return api<Product>(`/products/${encodeURIComponent(id)}`);
}

export function createProduct(input: ProductInput) {
  return api<Product>('/products', { method: 'POST', body: input });
}

export function updateProduct(id: string, input: ProductInput) {
  return api<Product>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: input });
}

export function deleteProduct(id: string) {
  return api<{ id: string }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
