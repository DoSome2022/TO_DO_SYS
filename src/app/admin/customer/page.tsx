import Link from "next/link";
import CustomerList from "./_components/CustomerList";


export default function CustomersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers Management</h1>
        <Link 
          href="/admin/customer/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>
      
      {/* 列表由 Client Component 處理互動與資料獲取 */}
      <CustomerList />
    </div>
  );
}
