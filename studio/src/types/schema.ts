import { translate as t } from "@/utils";
import * as z from "zod";

export const NAME_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
export const DNAME_REGEX = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export const NameSchema = z
  .string({
    required_error: t("forms.required", {
      label: t("general.name"),
    }),
  })
  .min(2, {
    message: t("forms.min2.error", {
      label: t("general.name"),
    }),
  })
  .max(64, {
    message: t("forms.max64.error", {
      label: t("general.name"),
    }),
  })
  .regex(NAME_REGEX, {
    message: t("forms.nameInvalidCharacters"),
  })
  .trim()
  .refine(
    (value) => value.trim().length > 0,
    t("forms.required", {
      label: t("general.name"),
    })
  )
  .refine(
    (value) => value !== "this",
    (value) => ({
      message: t("forms.reservedKeyword", {
        keyword: value,
        label: t("general.name"),
      }),
    })
  );

export const ChangeNameFormSchema = z.object({
  name: z
    .string({
      required_error: t("forms.required", {
        label: t("general.name"),
      }),
    })
    .min(2, t("forms.min2.error", { label: t("general.name") }))
    .max(64, t("forms.max64.error", { label: t("general.name") }))
    .trim()
    .refine(
      (value) => value.trim().length > 0,
      t("forms.required", {
        label: t("general.name"),
      })
    )
    .refine(
      (value) => value !== "this",
      (value) => ({
        message: t("forms.reservedKeyword", {
          keyword: value,
          label: t("general.name"),
        }),
      })
    ),
});

export const CustomDomainSchema = z.object({
  domain: z
    .string({
      required_error: t("forms.required", {
        label: t("cluster.domain.title"),
      }),
    })
    .regex(DNAME_REGEX, {
      message: "Not a valid domain name",
    })
    .transform((value) => value.toLowerCase()),
});
