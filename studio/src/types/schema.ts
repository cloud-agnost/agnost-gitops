import { FORBIDDEN_RESOURCE_NAMES } from "@/constants";
import {
  DNAME_REGEX,
  NAME_REGEX,
  NOT_START_WITH_NUMBER_REGEX,
  NOT_START_WITH_UNDERSCORE_REGEX,
  RESOURCE_NAME_REGEX,
} from "@/constants/regex";
import { translate as t } from "@/utils";
import * as z from "zod";

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
  .regex(NOT_START_WITH_UNDERSCORE_REGEX, {
    message: t("forms.notStartWithUnderscore", {
      label: t("general.name"),
    }),
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

export const ResourceNameSchema = z
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
  .regex(RESOURCE_NAME_REGEX, {
    message: t("resources.invalid_name"),
  })
  .regex(NOT_START_WITH_NUMBER_REGEX, {
    message: t("forms.notStartWithNumber", {
      label: t("general.name"),
    }),
  })
  .trim()
  .refine((value) => !value.startsWith("-"), {
    message: t("forms.notStartWithUnderscore", {
      label: t("general.name"),
    }),
  })
  .refine(
    (value) => !FORBIDDEN_RESOURCE_NAMES.includes(value),
    (value) => ({
      message: t("forms.reservedKeyword", {
        keyword: value,
      }),
    })
  )
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
