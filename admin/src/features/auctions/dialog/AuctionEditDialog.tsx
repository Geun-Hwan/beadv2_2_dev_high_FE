import { adminAuctionApi } from "@/apis/adminAuctionApi";
import type {
  AuctionDetailResponse,
  AuctionUpdateRequest,
} from "@moreauction/types";
import { toISOString } from "@moreauction/utils";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
} from "@/shared/components/dialogStyles";

type AuctionEditFormValues = {
  productName?: string;
  startBid: number;
  auctionStartAt: string;
  auctionEndAt: string;
};

type AuctionEditDialogProps = {
  open: boolean;
  auction: AuctionDetailResponse | null;
  onClose: () => void;
  onExited: () => void;
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
};

const AuctionEditDialog = ({
  open,
  auction,
  onClose,
  onExited,
}: AuctionEditDialogProps) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AuctionEditFormValues>({
    defaultValues: {
      productName: "",
      startBid: 10000,
      auctionStartAt: "",
      auctionEndAt: "",
    },
  });

  useEffect(() => {
    if (!open || !auction) return;
    reset({
      productName: auction.productName ?? "",
      startBid: auction.startBid ?? 10000,
      auctionStartAt: toInputDateTime(auction.auctionStartAt),
      auctionEndAt: toInputDateTime(auction.auctionEndAt),
    });
  }, [open, auction, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: AuctionUpdateRequest) => {
      if (!auction?.id) {
        return Promise.reject(new Error("경매 ID가 없습니다."));
      }
      return adminAuctionApi.modifyAuction(auction.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      onClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ??
        error?.data?.message ??
        "경매 수정에 실패했습니다.";
      setSubmitError(message);
    },
  });

  const handleUpdate = (values: AuctionEditFormValues) => {
    updateMutation.mutate({
      productName: values.productName?.trim() || undefined,
      startBid: Number(values.startBid),
      auctionStartAt: toISOString(values.auctionStartAt),
      auctionEndAt: toISOString(values.auctionEndAt),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogPaperSx }}
      TransitionProps={{
        onExited: () => {
          setSubmitError(null);
          reset();
          onExited();
        },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>경매 수정</DialogTitle>
      <DialogContent dividers sx={dialogContentSx}>
        <Stack spacing={2}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            경매 ID: {auction?.id ?? "-"}
          </Typography>
          <TextField
            label="상품명"
            fullWidth
            {...register("productName")}
          />
          <TextField
            label="시작 가격"
            type="number"
            {...register("startBid", {
              required: "시작 가격은 필수입니다.",
              min: {
                value: 10000,
                message: "최소 10,000원 이상 입력해주세요.",
              },
            })}
            error={!!errors.startBid}
            helperText={errors.startBid?.message}
            fullWidth
            required
          />
          <TextField
            label="시작 시간"
            type="datetime-local"
            {...register("auctionStartAt", {
              required: "시작 시간은 필수입니다.",
              validate: (value) => {
                if (!value) return "시작 시간은 필수입니다.";
                return true;
              },
            })}
            error={!!errors.auctionStartAt}
            helperText={errors.auctionStartAt?.message}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="종료 시간"
            type="datetime-local"
            {...register("auctionEndAt", {
              required: "종료 시간은 필수입니다.",
              validate: (value) => {
                const startTime = watch("auctionStartAt");
                if (startTime && new Date(value) <= new Date(startTime)) {
                  return "종료 시간은 시작 시간 이후여야 합니다.";
                }
                return true;
              },
            })}
            error={!!errors.auctionEndAt}
            helperText={errors.auctionEndAt?.message}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleUpdate)}
          disabled={updateMutation.isPending || !auction}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuctionEditDialog;
