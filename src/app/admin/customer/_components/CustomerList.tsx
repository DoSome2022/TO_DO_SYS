// src/app/admin/customer/_components/CustomerList.tsx

"use client";


import Link from "next/link";
import { Loader2 } from "lucide-react";
import { trpc } from "../../../../../trpc/client";

export default function CustomerList() {
  const { data: customers, isLoading } = trpc.customer.getAllCustomer.useQuery();

  if (isLoading) return <Loader2 className="animate-spin mx-auto mt-10" />;

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Company</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {customers?.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="p-4">{customer.name || "-"}</td>
              <td className="p-4">{customer.companyname || "-"}</td>
              <td className="p-4">{customer.email}</td>
              <td className="p-4">
                <Link 
                  href={`/admin/customer/${customer.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit / View
                </Link>
              </td>
            </tr>
          ))}
          {customers?.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">No customers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
