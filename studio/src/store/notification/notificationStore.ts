import NotificationService from "@/services/NotificationService";
import {
  GetAuditLogsRequest,
  GetDistinctActionsRequest,
  Notification,
} from "@/types";
import { create } from "zustand";

type NotificationStore = {
  notifications: Notification[];
  notificationsPreview: Notification[];
  notificationLastSeen: Date;
  notificationLastFetchedPage: number | undefined;
};

type NotificationActions = {
  getNotifications: (req: GetAuditLogsRequest) => Promise<void>;
  getNotificationsPreview: (req: GetAuditLogsRequest) => Promise<void>;
  getDistinctActions: (req: GetDistinctActionsRequest) => Promise<string[]>;
  updateNotificationLastSeen: () => void;
};

const initialState: NotificationStore = {
  notifications: [],
  notificationsPreview: [],
  notificationLastSeen: new Date(),
  notificationLastFetchedPage: undefined,
};

const useNotificationStore = create<NotificationStore & NotificationActions>(
  (set) => ({
    ...initialState,
    async getNotificationsPreview(req: GetAuditLogsRequest) {
      const notifications = await NotificationService.getAuditLogs(req);
      // const user = useAuthStore.getState().user;
      // const allowedNotifications = user?.notifications.map((ntf) => {
      //   if (ntf === "org") return ntf;
      //   if (ntf === "project") return `org.${ntf}`;
      //   return `org.project.environment.${ntf}`;
      // });

      // const filteredNotifications = notifications.filter((ntf: Notification) =>
      //   allowedNotifications?.includes(ntf.object)
      // );
      set({
        notificationsPreview: notifications,
      });
      return notifications;
    },
    async getNotifications(params: GetAuditLogsRequest) {
      const notifications = await NotificationService.getAuditLogs(params);
      if (params.page === 0) {
        set({
          notifications,
          notificationLastFetchedPage: params.page,
        });
      } else {
        set((prev) => ({
          notifications: [...prev.notifications, ...notifications],
          notificationLastFetchedPage: params.page,
        }));
      }
    },
    async getDistinctActions(params: GetDistinctActionsRequest) {
      return NotificationService.getDistinctActions(params);
    },
    updateNotificationLastSeen: () => {
      set({ notificationLastSeen: new Date() });
    },
    reset: () => set(initialState),
  })
);

export default useNotificationStore;
