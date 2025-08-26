"use client";

import { Button, Container, PasswordInput, TextInput } from "@mantine/core";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Container pt="40vh">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          if (form.email.value === "") return;
          if (form.password.value === "") return;
          login({
            email: form.email.value,
            password: form.password.value,
          });
        }}
      >
        <TextInput id="email" withAsterisk label="Email" />
        <PasswordInput id="password" withAsterisk label="Password" />
        <Button type="submit" mt="sm">
          Log in
        </Button>
      </form>
    </Container>
  );
}
