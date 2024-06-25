import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
  cluster,
  container,
  forms,
  general,
  login,
  onboarding,
  organization,
  profileSettings,
  project,
  resources as rs,
} from "./en";

export const resources = {
  en: {
    translation: {
      login,
      forms,
      general,
      organization,
      profileSettings,
      onboarding,
      resources: rs,
      cluster,
      project,
      container,
    },
  },
};

i18next
  .use(initReactI18next)
  .init({
    lng: "en", // if you're using a language detector, do not define the lng option
    debug: true,
    resources,
    defaultNS: "translation",
  })
  .catch(console.error);

export const { t } = i18next;

export default i18next;
