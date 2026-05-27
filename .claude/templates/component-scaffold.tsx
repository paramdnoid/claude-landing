import type { ComponentPropsWithoutRef } from "react";

type ExampleProps = ComponentPropsWithoutRef<"section"> & {
  title: string;
  description?: string;
};

export function Example({ title, description, className, ...props }: ExampleProps) {
  return (
    <section className={className} {...props}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
