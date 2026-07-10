import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoadingButton({
  loading,
  children,
  ...props
}) {
  return (
    <Button
      {...props}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait...
        </>
      ) : (
        children
      )}
    </Button>
  );
}