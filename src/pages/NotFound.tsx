import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="That page doesn't exist. Let's get you back to generating ideas."
      actionLabel="Back to Home"
      onAction={() => navigate("/")}
    />
  );
}
