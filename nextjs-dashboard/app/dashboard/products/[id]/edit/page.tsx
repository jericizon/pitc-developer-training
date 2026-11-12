import ProductForm from '@/app/ui/products/product-form';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit product</h1>
        <p className="mt-1 text-sm text-gray-500">Update the product details and save.</p>
      </header>
      <ProductForm id={id} />
    </>
  );
}
