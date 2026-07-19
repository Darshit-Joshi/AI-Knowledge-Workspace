export default function AuthHeader({
  title,
  subtitle,
}) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold">
        {title}
      </h1>

      <p className="text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}