import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";

export default function useAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User>();

  useEffect(() => {
    (async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData?.user) {
        redirect("/login");
      }
      setUser(authData.user);
    })();
  }, [supabase.auth]);

  return user;
}
