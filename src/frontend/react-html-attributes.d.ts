import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    interestFor?: string;
  }
}
