import { Alert, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import type { OrderResponse } from "@moreauction/types";
import { formatWon } from "@moreauction/utils";

interface PaymentSummaryCardProps {
  order: OrderResponse;
  payableAmount: number;
  isPayExpired: boolean;
  isUnpaid: boolean;
  actionLoading: boolean;
  onOpenPaymentDialog: () => void;
}

const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  order,
  payableAmount,
  isPayExpired,
  isUnpaid,
  actionLoading,
  onOpenPaymentDialog,
}) => {
  const renderRow = (label: string, value?: React.ReactNode) => (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        결제 요약
      </Typography>
      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={1}>
        {renderRow("추가 결제금액", formatWon(payableAmount))}
        {renderRow(
          "결제 기한",
          order.payLimitDate
            ? new Date(order.payLimitDate).toLocaleString()
            : "-"
        )}
        {renderRow(
          "구매 완료일",
          order.payCompleteDate
            ? new Date(order.payCompleteDate).toLocaleString()
            : "구매 대기"
        )}
      </Stack>
      {isPayExpired && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          결제 기한이 만료되어 구매를 진행할 수 없습니다.
        </Alert>
      )}
      {isUnpaid && (
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={onOpenPaymentDialog}
          disabled={actionLoading || isPayExpired}
        >
          결제하기
        </Button>
      )}
    </Paper>
  );
};

export default PaymentSummaryCard;
