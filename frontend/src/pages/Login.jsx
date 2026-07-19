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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import PasswordInput from "@/components/auth/PasswordInput";

import { loginSchema } from "@/utils/authSchemas";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/services/authService"; 
import {api} from "@/services/apiService"; 
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      // Call backend login API
      const response = await loginUser(data);

      // Save token locally
      localStorage.setItem("token", response.access_token);

      // Fetch current user profile
      const me = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
      });

      // Update auth context
      login(me.data);

      // Redirect to dashboard
      navigate("/dashboard");

      toast.success("Login successful!");
    } catch (error) {
      toast.error("Invalid credentials");
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
            Welcome back
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Email */}

            <div>
              <Label>Email</Label>

              <Input
                {...register("email")}
                placeholder="prachi@example.com"
              />

              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}

            <div>
              <Label>Password</Label>

              <PasswordInput
                {...register("password")}
                placeholder="Enter Password"
              />

              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />

                <Label
                  htmlFor="remember"
                  className="cursor-pointer"
                >
                  Remember Me
                </Label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? "Signing In..."
                : "Login"}
            </Button>

            {/* Divider */}

            <div className="relative">
              <Separator />

              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>

            {/* Google Login */}

            <Button
              type="button"
              variant="outline"
              className="w-full"
            >
              Continue with Google
            </Button>

            {/* Register */}

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}