import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import type { AuctionDetailResponse } from "@moreauction/types";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { formatDate, formatWon } from "@moreauction/utils";
import {
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
} from "@/shared/components/dialogStyles";

type AuctionDetailDialogProps = {
  open: boolean;
  auction: AuctionDetailResponse | null;
  onClose: () => void;
  onExited: () => void;
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
);

const AuctionDetailDialog = ({
  open,
  auction,
  onClose,
  onExited,
}: AuctionDetailDialogProps) => {
  const [snapshot, setSnapshot] = useState<AuctionDetailResponse | null>(null);
  const deletedFlag =
    snapshot?.deletedYn === true || snapshot?.deletedYn === "Y";
  const [tabValue, setTabValue] = useState<"detail" | "participants">("detail");
  const displayAuction = snapshot ?? auction;

  useEffect(() => {
    if (open && auction) {
      setSnapshot(auction);
    }
  }, [open, auction]);

  useEffect(() => {
    if (!open) return;
    setTabValue("detail");
  }, [open]);

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
      <DialogTitle sx={dialogTitleSx}>경매 상세</DialogTitle>
      <DialogContent dividers sx={dialogContentSx}>
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          sx={{ mb: 2 }}
        >
          <Tab value="detail" label="상세" />
          <Tab value="participants" label="참여자 목록" />
        </Tabs>
        {displayAuction ? (
          tabValue === "detail" ? (
            <Stack spacing={2}>
              <InfoRow label="경매 ID" value={displayAuction.id} />
              <InfoRow label="상품 ID" value={displayAuction.productId ?? "-"} />
              <InfoRow label="상품명" value={displayAuction.productName ?? "-"} />
              <InfoRow label="판매자 ID" value={displayAuction.sellerId ?? "-"} />
              <InfoRow
                label="최고 입찰자"
                value={displayAuction.highestUserId ?? "-"}
              />
              <InfoRow label="시작가" value={formatWon(displayAuction.startBid)} />
              <InfoRow
                label="현재가"
                value={
                  formatWon(
                    displayAuction.currentBid && displayAuction.currentBid !== 0
                      ? displayAuction.currentBid
                      : displayAuction.startBid
                  ) ?? 0
                }
              />
              <InfoRow
                label="시작 시간"
                value={formatDate(displayAuction.auctionStartAt)}
              />
              <InfoRow
                label="종료 시간"
                value={formatDate(displayAuction.auctionEndAt)}
              />
              <InfoRow
                label="상태"
                value={<Chip size="small" label={displayAuction.status} />}
              />
              <InfoRow
                label="삭제 상태"
                value={
                  <Chip
                    size="small"
                    label={deletedFlag ? "Y" : "N"}
                    color={deletedFlag ? "default" : "success"}
                    variant={deletedFlag ? "outlined" : "filled"}
                  />
                }
              />
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                참여자 목록은 준비 중입니다.
              </Typography>
            </Stack>
          )
        ) : (
          <Typography color="text.secondary">
            선택된 경매가 없습니다.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuctionDetailDialog;
