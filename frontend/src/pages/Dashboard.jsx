import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Welcome {user?.username}
      </h1>

      <p className="text-muted-foreground mt-2">
        AI Knowledge Workspace
      </p>
    </div>
  );
}