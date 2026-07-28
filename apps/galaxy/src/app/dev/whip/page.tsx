import { notFound } from "next/navigation";
import WhipDevClient from "./WhipDevClient";

export default function WhipDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <WhipDevClient />;
}
