import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CustomerChat from "@/components/sales/CustomerChat";

export default async function CustomerChatPage({
  params,
}: {
  params: { customerId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return <CustomerChat />;
}