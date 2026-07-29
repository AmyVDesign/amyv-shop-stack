import { notFound } from "next/navigation";
import StaffDevClient from "./StaffDevClient";

export default function StaffDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StaffDevClient />;
}
