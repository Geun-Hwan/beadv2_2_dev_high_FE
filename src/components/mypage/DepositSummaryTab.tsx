import {
  Alert,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import type { DepositInfo } from "../../types/deposit";
import type { UserRole } from "../../types/user";

interface DepositSummaryTabProps {
  loading: boolean;
  error: string | null;
  depositInfo: DepositInfo | null;
  sellerInfo: { bankName?: string; bankAccount?: string } | null;
  role?: UserRole;
  onCreateAccount: () => void;
  onOpenChargeDialog: () => void;
}

export const DepositSummaryTab: React.FC<DepositSummaryTabProps> = ({
  loading,
  error,
  depositInfo,
  sellerInfo,
  role,
  onCreateAccount,
  onOpenChargeDialog,
}) => {
  const isBuyerOnly = role === "USER";
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        예치금 정보
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        <ListItem>
          <ListItemText
            primary="현재 잔액"
            secondary={
              loading && !depositInfo ? (
                <Skeleton width="40%" />
              ) : (
                `${depositInfo?.balance?.toLocaleString() || 0}원`
              )
            }
          />
        </ListItem>
        {!isBuyerOnly && (
          <>
            <Divider />

            <ListItem>
              <ListItemText
                primary="은행명"
                secondary={
                  loading && !sellerInfo ? (
                    <Skeleton width="60%" />
                  ) : (
                    sellerInfo?.bankName || "정보 없음"
                  )
                }
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="계좌 번호"
                secondary={
                  loading && !sellerInfo ? (
                    <Skeleton width="60%" />
                  ) : (
                    sellerInfo?.bankAccount || "정보 없음"
                  )
                }
              />
            </ListItem>
          </>
        )}
      </List>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={onCreateAccount}
          sx={{ mr: 3 }}
          disabled={loading}
        >
          예치금 계좌 생성
        </Button>
        <Button
          variant="contained"
          onClick={onOpenChargeDialog}
          disabled={loading}
        >
          예치금 충전
        </Button>
      </Box>
    </Paper>
  );
};
