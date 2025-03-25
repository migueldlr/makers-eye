import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";

export default function LinkToDashboard() {
  const router = useRouter();

  return <Button onClick={() => router.push("/private")}>Dashboard</Button>;
}
