import CustomerForm from "../_components/CustomerForm";

// Next.js 16 寫法：params 是 Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  // 必須 await 解析參數
  const resolvedParams = await params;
  const customerId = resolvedParams.id;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Customer details</h1>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        {/* 將解析後的 ID 傳入 Client Component */}
        <CustomerForm customerId={customerId} />
      </div>
    </div>
  );
}
