"use client";

import { useEffect, useRef, useTransition, type ComponentProps } from "react";

type ActionFormProps = Omit<ComponentProps<"form">, "action"> & {
  action: (data: FormData) => void;
  pending?: boolean;
  resetAfterSuccess?: object;
};

/** Keep draft values when an action returns a validation or business error. */
export function ActionForm({ action, pending, resetAfterSuccess, onSubmit, children, ...props }: ActionFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [submitting, startTransition] = useTransition();
  useEffect(() => {
    if (resetAfterSuccess) form.current?.reset();
  }, [resetAfterSuccess]);

  return <form {...props} ref={form} action={action} aria-busy={pending || submitting || undefined} onSubmit={(event) => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (pending || submitting) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => action(data));
  }}>{children}</form>;
}
