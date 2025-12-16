import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Container,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  FavoriteBorder as FavoriteBorderIcon, // 찜화면 아이콘 추가
  Receipt as ReceiptIcon, // 결제대기(주문서) 아이콘 추가
  Gavel as GavelIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useThemeContext } from "../contexts/ThemeProvider";
import { useEffect, useState } from "react";
import { notificationApi } from "../apis/notificationApi";

export const AppHeader: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeContext();
  const [unreadCount, setUnreadCount] = useState(0);

  // 로그인된 경우에만 미확인 알림 개수 조회
  useEffect(() => {
    let cancelled = false;

    const fetchUnreadCount = async () => {
      if (!isAuthenticated || !user?.userId) {
        setUnreadCount(0);
        return;
      }

      try {
        const pageRes = await notificationApi.getNotifications({
          userId: user.userId,
          page: 0,
          size: 50,
        });
        if (cancelled) return;
        const count =
          pageRes.content?.filter((n) => n && n.readYn === false).length ?? 0;
        setUnreadCount(count);
      } catch (err) {
        if (!cancelled) {
          console.error("미확인 알림 개수 조회 실패:", err);
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.userId]);

  const handleLogout = () => {
    logout();
    alert("로그아웃 되었습니다.");
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={(theme) => ({
        backdropFilter: "blur(14px)",
        backgroundColor:
          theme.palette.mode === "light"
            ? "rgba(248, 250, 252, 0.9)"
            : "rgba(15, 23, 42, 0.9)",
        borderBottom: "1px solid",
        borderColor:
          theme.palette.mode === "light"
            ? "rgba(15, 23, 42, 0.06)"
            : "rgba(148, 163, 184, 0.25)",
      })}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* 좌측: 로고 + 메뉴 */}
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "inherit",
                textDecoration: "none",
                mr: 5,
              }}
            >
              <GavelIcon sx={{ fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                More Auction
              </Typography>
            </Box>
            {isAuthenticated && user && (
              <Typography variant="body1" color="inherit">
                {user?.nickname}님 환영합니다!
              </Typography>
            )}
          </Box>

          {/* 우측: 검색 + 로그인/회원정보 + 테마 토글 */}
          <Box display="flex" alignItems="center" gap={2}>
            {/* 검색 페이지로 이동 */}
            <IconButton
              component={RouterLink}
              to="/search"
              color="inherit"
              size="small"
            >
              <SearchIcon />
            </IconButton>

            {isAuthenticated ? (
              <>
                {/* 찜화면 아이콘 */}
                <IconButton
                  component={RouterLink}
                  to="/wishlist"
                  color="inherit"
                >
                  <FavoriteBorderIcon />
                </IconButton>
                {/* 결제대기(주문서) 아이콘 */}
                <IconButton
                  component={RouterLink}
                  to="/pending-orders"
                  color="inherit"
                >
                  <ReceiptIcon />
                </IconButton>

                <IconButton
                  component={RouterLink}
                  to="/notifications"
                  color="inherit"
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    invisible={unreadCount === 0}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <IconButton component={RouterLink} to="/mypage" color="inherit">
                  <AccountCircle />
                </IconButton>
                {/* 테마 토글: 마이페이지 아이콘 오른쪽 */}
                <IconButton
                  size="small"
                  onClick={toggleColorMode}
                  color="inherit"
                >
                  {mode === "dark" ? <LightIcon /> : <DarkIcon />}
                </IconButton>
                <Button color="inherit" onClick={handleLogout}>
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                {/* 비로그인 상태에서도 테마 토글은 노출 */}
                <IconButton
                  size="small"
                  onClick={toggleColorMode}
                  color="inherit"
                >
                  {mode === "dark" ? <LightIcon /> : <DarkIcon />}
                </IconButton>
                <Button color="inherit" component={RouterLink} to="/login">
                  로그인
                </Button>
                <Button color="inherit" component={RouterLink} to="/signup">
                  회원가입
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
