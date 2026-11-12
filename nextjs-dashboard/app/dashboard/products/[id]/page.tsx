import ProductDetail from '@/app/ui/products/product-detail';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Product details</h1>
      </header>
      <ProductDetail id={id} />
    </>
  );
}
