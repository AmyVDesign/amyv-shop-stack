import { notFound } from "next/navigation";
import SplitStaffDevClient from "./SplitStaffDevClient";

export default function SplitStaffDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SplitStaffDevClient />;
}
