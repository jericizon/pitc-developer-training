import ProductForm from '@/app/ui/products/product-form';

export default function Page() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add product</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new product in the catalog.</p>
      </header>
      <ProductForm />
    </>
  );
}
