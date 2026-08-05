import type { ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CommonProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
};

type InputFieldProps = CommonProps &
  Omit<ComponentProps<typeof Input>, "name" | "id" | "required"> & {
    as?: "input";
  };

type TextareaFieldProps = CommonProps &
  Omit<ComponentProps<typeof Textarea>, "name" | "id" | "required"> & {
    as: "textarea";
  };

type FormFieldProps = InputFieldProps | TextareaFieldProps;

/** Label + champ (Input ou Textarea), branché sur les Server Actions (name = clé FormData). */
export function FormField(props: FormFieldProps) {
  const { name, label, hint, required, as, ...rest } = props;
  const id = `field-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {as === "textarea" ? (
        <Textarea
          id={id}
          name={name}
          required={required}
          {...(rest as Omit<ComponentProps<typeof Textarea>, "name" | "id" | "required">)}
        />
      ) : (
        <Input
          id={id}
          name={name}
          required={required}
          {...(rest as Omit<ComponentProps<typeof Input>, "name" | "id" | "required">)}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
