import { z } from "zod";
import { UpdateProjectParams } from "./project";
import { NameSchema } from "./schema";

export interface Environment {
  orgId: string;
  projectId: string;
  iid: string;
  name: string;
  private: boolean;
  readOnly: boolean;
  createdBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export type GetEnvironmentRequest = UpdateProjectParams;

export interface GetEnvironmentByIdRequest {
  projectId: string;
  envId: string;
  orgId: string;
}

export const CreateNewEnvironmentSchema = z.object({
  name: NameSchema,
  private: z.boolean().default(false),
  readOnly: z.boolean().default(false),
});
export type CreateNewEnvironmentRequest = UpdateProjectParams &
  z.infer<typeof CreateNewEnvironmentSchema>;

export interface UpdateEnvironmentRequest extends CreateNewEnvironmentRequest {
  envId: string;
}

export interface DeleteEnvironmentRequest extends UpdateProjectParams {
  envId: string;
}
