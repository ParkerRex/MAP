import { HeadlessService } from "@novu/headless";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEV_USER_ID } from "@/lib/auth-constants";

export function useNotifications() {
  const [isLoading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [subscriberId, setSubscriberId] = useState<string>();
  const headlessServiceRef = useRef<HeadlessService>();

  const markAllMessagesAsRead = () => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => {
          return {
            ...notification,
            read: true,
          };
        }),
      );

      headlessService.markAllMessagesAsRead({
        listener: () => {},
        onError: () => {},
      });
    }
  };

  const markMessageAsRead = (messageId: string) => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => {
          if (notification.id === messageId) {
            return {
              ...notification,
              read: true,
            };
          }

          return notification;
        }),
      );

      headlessService.markNotificationsAsRead({
        messageId: [messageId],
        listener: (result) => {},
        onError: (error) => {},
      });
    }
  };

  const fetchNotifications = useCallback(() => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      headlessService.fetchNotifications({
        listener: ({}) => {},
        onSuccess: (response) => {
          setLoading(false);
          setNotifications(response.data);
        },
      });
    }
  }, []);

  const markAllMessagesAsSeen = () => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          seen: true,
        })),
      );
      headlessService.markAllMessagesAsSeen({
        listener: () => {},
        onError: () => {},
      });
    }
  };

  useEffect(() => {
    // TODO: Get actual user data when auth is set up
    // For now, use dev user ID
    setSubscriberId(`dev_${DEV_USER_ID}`);
  }, []);

  useEffect(() => {
    const headlessService = headlessServiceRef.current;

    if (headlessService) {
      headlessService.listenNotificationReceive({
        listener: () => {
          fetchNotifications();
        },
      });
    }
  }, [headlessServiceRef.current]);

  useEffect(() => {
    if (subscriberId && !headlessServiceRef.current) {
      const headlessService = new HeadlessService({
        applicationIdentifier:
          process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER!,
        subscriberId,
      });

      headlessService.initializeSession({
        listener: () => {},
        onSuccess: () => {
          headlessServiceRef.current = headlessService;
          fetchNotifications();
        },
        onError: () => {},
      });
    }
  }, [fetchNotifications, subscriberId]);

  return {
    isLoading,
    markAllMessagesAsRead,
    markMessageAsRead,
    markAllMessagesAsSeen,
    hasUnseenNotificaitons: notifications.some(
      (notification) => !notification.seen,
    ),
    notifications,
  };
}
