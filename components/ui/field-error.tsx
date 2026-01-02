/**
 * Reusable component for displaying form field errors
 */

interface FieldErrorProps {
  errors?: string[] | undefined[];
}

export function FieldError({ errors }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;
  
  // Filter out undefined values
  const validErrors = errors.filter((e): e is string => typeof e === 'string');
  if (validErrors.length === 0) return null;
  
  return (
    <p className="text-sm text-destructive">
      {validErrors.join(", ")}
    </p>
  );
}
