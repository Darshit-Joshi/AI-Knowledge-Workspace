import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import AuthLayout from "@/layouts/AuthLayout";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrength from "@/components/auth/PasswordStrength";

import { registerSchema } from "@/utils/authSchemas";

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      console.log(data);

      // API CALL HERE

      toast.success(
        "Account created successfully!"
      );
    } catch (error) {
      toast.error(
        "Failed to create account"
      );
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            AI Knowledge Workspace
          </CardTitle>

          <CardDescription>
            Create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div>
              <Label>Full Name</Label>

              <Input
                {...register("fullName")}
                placeholder="Prachi Ahlawat"
              />

              {errors.fullName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Email</Label>

              <Input
                {...register("email")}
                placeholder="prachi@example.com"
              />

              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label>Password</Label>

              <PasswordInput
                {...register("password")}
                placeholder="Create Password"
              />

              <PasswordStrength
                password={password || ""}
              />

              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Confirm Password
              </Label>

              <PasswordInput
                {...register(
                  "confirmPassword"
                )}
                placeholder="Confirm Password"
              />

              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {
                    errors.confirmPassword
                      .message
                  }
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}