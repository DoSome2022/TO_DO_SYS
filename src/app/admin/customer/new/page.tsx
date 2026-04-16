import CustomerForm from "../_components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Customer</h1>
      <CustomerForm />
    </div>
  );
}
