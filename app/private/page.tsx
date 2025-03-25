import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { Button, Container, Group, Stack } from "@mantine/core";
import { signOut } from "../login/actions";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <Container mt="lg">
      <Stack>
        Hello {data.user.email}
        <Group>
          <Button variant="subtle" onClick={signOut}>
            Sign out
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
