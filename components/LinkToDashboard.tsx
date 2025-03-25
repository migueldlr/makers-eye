"use client";

import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function LinkToDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    })();
  }, []);

  if (!user) {
    return null;
  }

  return (
    <Button
      color="orange"
      variant="outline"
      onClick={() => router.push("/dashboard")}
    >
      Dashboard
    </Button>
  );
}
