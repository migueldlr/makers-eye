"use client";

import { Button, Container, PasswordInput, TextInput } from "@mantine/core";
import { login } from "./actions";
import { useForm } from "@mantine/form";

export default function LoginPage() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length > 0 ? null : "Password is required"),
    },
  });

  return (
    <Container pt="40vh">
      <form onSubmit={form.onSubmit(login)}>
        <TextInput
          id="email"
          withAsterisk
          label="Email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          id="password"
          withAsterisk
          label="Password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" mt="sm">
          Log in
        </Button>
      </form>
    </Container>
  );
}
