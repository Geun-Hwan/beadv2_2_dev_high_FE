import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Chip,
  Box,
  Skeleton,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { notificationApi } from "../apis/notificationApi";
import type { NotificationInfo } from "../types/notification";

const Notifications: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user?.userId) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // 기본: 첫 페이지 20개만 조회
        const pageRes = await notificationApi.getNotifications({
          userId: user.userId,
          page: 0,
          size: 20,
        });
        setNotifications(pageRes.content || []);
      } catch (err) {
        console.error("알림 조회 실패:", err);
        setError("알림을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user]);

  const handleClickNotification = (notification: NotificationInfo) => {
    if (notification.relatedUrl) {
      // 관련 URL이 있으면 해당 화면으로 이동
      navigate(notification.relatedUrl);
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const showSkeleton = loading && notifications.length === 0 && !error;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          알림
        </Typography>
        <Paper sx={{ p: 2 }}>
          {!showSkeleton && error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          {!showSkeleton && !error && notifications.length === 0 && (
            <Alert severity="info" sx={{ width: "100%" }}>
              새로운 알림이 없습니다.
            </Alert>
          )}
          {showSkeleton &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  mb: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Skeleton width="70%" />
                <Skeleton width="90%" />
              </Box>
            ))}

          {!showSkeleton &&
            !error &&
            notifications.map((notification, index) => (
              <Box
                key={notification.id ?? index}
                onClick={() => handleClickNotification(notification)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  mb: 2,
                  cursor: notification.relatedUrl ? "pointer" : "default",
                  bgcolor: notification.readYn
                    ? "background.paper"
                    : "action.hover",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: notification.readYn
                      ? "action.hover"
                      : "action.selected",
                  },
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {!notification.readYn && (
                      <Chip
                        label="NEW"
                        color="primary"
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                    )}
                    <Typography
                      variant="subtitle1"
                      fontWeight={notification.readYn ? 400 : 600}
                    >
                      {notification.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(notification.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {notification.content}
                </Typography>
              </Box>
            ))}
        </Paper>
      </Box>
    </Container>
  );
};

export default Notifications;
