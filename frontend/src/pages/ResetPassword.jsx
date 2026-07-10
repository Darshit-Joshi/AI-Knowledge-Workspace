import { Link, useParams } from "react-router-dom";
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

export default function ResetPassword() {
  const { token } = useParams();

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const data = {
      token,
      password,
    };

    console.log(data);

    // Call reset password API here
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">
            Reset Password
          </CardTitle>

          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* New Password */}

            <div className="space-y-2">
              <Label htmlFor="password">
                New Password
              </Label>

              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                required
              />
            </div>

            {/* Confirm Password */}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
              />
            </div>

            {/* Submit */}

            <Button
              type="submit"
              className="w-full"
            >
              Update Password
            </Button>

            {/* Login Link */}

            <p className="text-center text-sm text-muted-foreground">
              Back to{" "}
              <Link
                to="/"
                className="font-medium text-primary hover:underline"
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