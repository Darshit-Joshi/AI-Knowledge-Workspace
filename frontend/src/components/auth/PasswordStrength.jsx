export default function PasswordStrength({
  password,
}) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = [
    "Very Weak",
    "Weak",
    "Medium",
    "Strong",
    "Excellent",
  ];

  return (
    <div className="space-y-2">
      <div className="h-2 rounded bg-muted">
        <div
          className="h-2 rounded bg-primary transition-all"
          style={{
            width: `${score * 25}%`,
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {labels[score]}
      </p>
    </div>
  );
}