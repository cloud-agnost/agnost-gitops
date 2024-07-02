import TypesService from "@/services/TypesService";
import { APIError, Types } from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
interface TypesStore {
  orgRoles: string[];
  projectRoles: string[];
  orgRoleDesc: Record<string, string>;
  projectRoleDesc: Record<string, string>;
  isTypesOk: boolean;
  timezones: {
    label: string;
    name: string;
    value: string;
    utc: string;
  }[];
  getAllTypes: () => Promise<Types | APIError>;
}

const useTypeStore = create<TypesStore>()(
  devtools(
    persist(
      (set) => ({
        orgRoles: [],
        appRoles: [],
        projectRoles: [],
        orgRoleDesc: {},
        appRoleDesc: {},
        projectRoleDesc: {},
        isTypesOk: false,
        timezones: [],
        getAllTypes: async () => {
          try {
            const res = await TypesService.getAllTypes();
            set({
              ...res,
              isTypesOk: true,
            });
            return res;
          } catch (error) {
            throw error as APIError;
          }
        },
      }),
      {
        name: "type-store",
      }
    )
  )
);
export default useTypeStore;
