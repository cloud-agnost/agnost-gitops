import TypesService from "@/services/TypesService";
import { APIError, ResourceType, Types } from "@/types";

import { create } from "zustand";

import { devtools, persist } from "zustand/middleware";
interface TypesStore {
  orgRoles: string[];
  projectRoles: string[];
  orgRoleDesc: Record<string, string>;
  projectRoleDesc: Record<string, string>;
  bvlTypes: string[];
  databaseTypes: string[];
  instanceTypes: {
    engine: string[];
    database: string[];
    cache: string[];
    storage: string[];
    queue: string[];
    scheduler: string[];
    realtime: string[];
  };
  authUserDataModel: {
    name: string;
    type: string;
  }[];
  resourceTypes: ResourceType[];
  isTypesOk: boolean;
  resourceVersions: {
    [key: string]: string[];
  };
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
        bvlTypes: [],
        fieldTypes: [],
        databaseTypes: [],
        instanceTypes: {
          engine: [],
          database: [],
          cache: [],
          storage: [],
          queue: [],
          scheduler: [],
          realtime: [],
        },
        ftsIndexLanguages: {
          PostgreSQL: [],
          MySQL: [],
          MongoDB: [],
          "SQL Server": [],
        },
        authUserDataModel: [
          {
            name: "",
            type: "",
          },
        ],
        resourceVersions: {},
        isTypesOk: false,
        resourceTypes: [],
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
