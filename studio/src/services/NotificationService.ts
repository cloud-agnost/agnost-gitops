import { axios } from "@/helpers";
import { GetAuditLogsRequest, GetDistinctActionsRequest } from "@/types";

export default class NotificationService {
  static url = "/v1/log/org";

  static async getAuditLogs({ orgId, ...rest }: GetAuditLogsRequest) {
    return (
      await axios.get(`${this.url}/${orgId}`, {
        params: rest,
      })
    ).data;
  }
  static async getDistinctActions({
    orgId,
    ...rest
  }: GetDistinctActionsRequest) {
    return (
      await axios.get(`${this.url}/${orgId}/filters`, {
        params: rest,
      })
    ).data;
  }
}
