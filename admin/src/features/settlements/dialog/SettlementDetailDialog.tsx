import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import type { SettlementSummary } from "@moreauction/types";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { formatDate, formatWon } from "@moreauction/utils";
import {
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
} from "@/shared/components/dialogStyles";

type SettlementDetailDialogProps = {
  open: boolean;
  settlement: SettlementSummary | null;
  onClose: () => void;
  onExited: () => void;
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
);

const SettlementDetailDialog = ({
  open,
  settlement,
  onClose,
  onExited,
}: SettlementDetailDialogProps) => {
  const [snapshot, setSnapshot] = useState<SettlementSummary | null>(null);
  const displaySettlement = snapshot ?? settlement;

  useEffect(() => {
    if (open && settlement) {
      setSnapshot(settlement);
    }
  }, [open, settlement]);

  const handleExited = () => {
    setSnapshot(null);
    onExited();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogPaperSx }}
      TransitionProps={{ onExited: handleExited }}
    >
      <DialogTitle sx={dialogTitleSx}>정산 상세</DialogTitle>
      <DialogContent dividers sx={dialogContentSx}>
        {displaySettlement ? (
          <Stack spacing={2}>
            <InfoRow label="정산 그룹 ID" value={displaySettlement.id} />
            <InfoRow label="판매자 ID" value={displaySettlement.sellerId} />
            <InfoRow
              label="정산일"
              value={formatDate(displaySettlement.settlementDate)}
            />
            <InfoRow
              label="총액"
              value={formatWon(
                displaySettlement.totalFinalAmount +
                  displaySettlement.totalCharge
              )}
            />
            <InfoRow
              label="정산 예정액"
              value={formatWon(displaySettlement.totalFinalAmount)}
            />
            <InfoRow
              label="수수료 예정액"
              value={formatWon(displaySettlement.totalCharge)}
            />
            <InfoRow
              label="총 지급액"
              value={formatWon(
                displaySettlement.paidFinalAmount + displaySettlement.paidCharge
              )}
            />
            <InfoRow
              label="정산 지급액"
              value={formatWon(displaySettlement.paidFinalAmount)}
            />
            <InfoRow
              label="차감 수수료"
              value={formatWon(displaySettlement.paidCharge)}
            />
            <InfoRow
              label="상태"
              value={
                <Chip size="small" label={displaySettlement.depositStatus} />
              }
            />
            <InfoRow
              label="등록일"
              value={formatDate(displaySettlement.createdAt)}
            />
            <InfoRow
              label="수정일"
              value={formatDate(displaySettlement.updateDate)}
            />
          </Stack>
        ) : (
          <Typography color="text.secondary">
            선택된 정산이 없습니다.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettlementDetailDialog;
