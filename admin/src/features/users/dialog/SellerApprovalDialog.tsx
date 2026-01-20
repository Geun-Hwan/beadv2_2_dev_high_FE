import { adminUserApi } from "@/apis/adminUserApi";
import {
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
} from "@/shared/components/dialogStyles";
import DialogTable from "@/shared/components/DialogTable";
import { PAGE_SIZE } from "@/shared/constant/const";
import { SellerStatus, type SellerApprovalItem } from "@moreauction/types";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type SellerApprovalDialogProps = {
  open: boolean;
  onClose: () => void;
};

const sellerStatusOptions = [
  { value: SellerStatus.PENDING, label: "미승인" },
  { value: SellerStatus.ACTIVE, label: "승인" },
  { value: SellerStatus.INACTIVE, label: "비활성" },
  { value: SellerStatus.BLACKLISTED, label: "블랙리스트" },
  { value: SellerStatus.WITHDRAWN, label: "탈퇴" },
];

const getSellerStatusLabel = (status?: SellerStatus) => {
  const option = sellerStatusOptions.find((item) => item.value === status);
  return option?.label ?? status ?? "-";
};

const getSellerId = (seller: SellerApprovalItem) => seller.userId ?? "";

const SellerApprovalDialog = ({ open, onClose }: SellerApprovalDialogProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus>(
    SellerStatus.PENDING
  );
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);

  const resetState = () => {
    setPage(1);
    setSellerStatus(SellerStatus.PENDING);
    setSelectedSellerIds([]);
  };

  const sellersQuery = useQuery({
    queryKey: ["admin", "sellers", page, sellerStatus],
    queryFn: () =>
      adminUserApi.getSellers({
        page: page - 1,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
        status: sellerStatus,
      }),
    enabled: open,
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const approveSelectedMutation = useMutation({
    mutationFn: (payload: { sellerIds: string[] }) =>
      adminUserApi.approveSellerSelected(payload),
    onSuccess: () => {
      alert("선택한 판매자가 승인되었습니다.");
      setSelectedSellerIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
    },
    onError: (error: any) => {
      alert(error?.data?.message ?? "선택 승인에 실패했습니다.");
    },
  });

  const approveBatchMutation = useMutation({
    mutationFn: () => adminUserApi.approveSellerBatch(),
    onSuccess: () => {
      alert("미승인 판매자가 모두 승인되었습니다.");
      setSelectedSellerIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
    },
    onError: (error: any) => {
      alert(error?.data?.message ?? "전체 승인에 실패했습니다.");
    },
  });

  const errorMessage = useMemo(() => {
    if (!sellersQuery.isError) return null;
    return "판매자 목록을 불러오지 못했습니다.";
  }, [sellersQuery.isError]);

  const totalPages = sellersQuery.data?.totalPages ?? 1;
  const sellers = sellersQuery.data?.content ?? [];
  const showEmpty =
    !sellersQuery.isLoading && !sellersQuery.isError && sellers.length === 0;

  const pendingIds = useMemo(
    () =>
      sellers
        .filter((seller) => seller.status === SellerStatus.PENDING)
        .map(getSellerId)
        .filter(Boolean),
    [sellers]
  );

  const isAllSelected =
    pendingIds.length > 0 &&
    pendingIds.every((id) => selectedSellerIds.includes(id));
  const isIndeterminate =
    selectedSellerIds.length > 0 && !isAllSelected && pendingIds.length > 0;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedSellerIds((prev) =>
        prev.filter((id) => !pendingIds.includes(id))
      );
      return;
    }
    setSelectedSellerIds((prev) =>
      Array.from(new Set([...prev, ...pendingIds]))
    );
  };

  const handleToggleSeller = (sellerId: string) => {
    setSelectedSellerIds((prev) =>
      prev.includes(sellerId)
        ? prev.filter((id) => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  const handleApproveSelected = () => {
    if (selectedSellerIds.length === 0) return;
    if (!window.confirm("선택한 판매자를 승인하시겠습니까?")) return;
    approveSelectedMutation.mutate({ sellerIds: selectedSellerIds });
  };

  const handleApproveBatch = () => {
    if (!window.confirm("미승인 판매자를 모두 승인하시겠습니까?")) return;
    approveBatchMutation.mutate();
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    setSelectedSellerIds([]);
  }, [page, sellerStatus]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: dialogPaperSx }}
      TransitionProps={{
        onExited: () => {
          resetState();
        },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>판매자 승인</DialogTitle>
      <DialogContent dividers sx={dialogContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              기본으로 미승인(PENDING) 판매자 목록이 표시됩니다.
            </Typography>
            <Select
              size="small"
              value={sellerStatus}
              onChange={(event) => {
                setPage(1);
                setSellerStatus(event.target.value as SellerStatus);
              }}
              sx={{ minWidth: 160 }}
            >
              {sellerStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <DialogTable>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleToggleAll}
                    disabled={pendingIds.length === 0}
                  />
                </TableCell>
                <TableCell align="center">유저 ID</TableCell>
                <TableCell align="center">정산 계좌</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sellersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">
                      판매자 목록을 불러오는 중...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {errorMessage && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Alert severity="error">{errorMessage}</Alert>
                  </TableCell>
                </TableRow>
              )}
              {sellers.map((seller) => {
                const sellerId = getSellerId(seller);
                const currentStatus = seller.status;
                const isPending = currentStatus === SellerStatus.PENDING;
                const isSelected = sellerId
                  ? selectedSellerIds.includes(sellerId)
                  : false;
                return (
                  <TableRow key={sellerId} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {
                          if (!sellerId || !isPending) return;
                          handleToggleSeller(sellerId);
                        }}
                        disabled={!sellerId || !isPending}
                      />
                    </TableCell>
                    <TableCell align="center">{seller.userId ?? "-"}</TableCell>
                    <TableCell align="center">
                      {seller.bankName && seller.bankAccount
                        ? `${seller.bankName} ${seller.bankAccount}`
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {getSellerStatusLabel(currentStatus)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {showEmpty && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">
                      조건에 해당하는 판매자가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </DialogTable>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.max(totalPages, 1)}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
              disabled={totalPages === 0}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Box sx={{ flex: 1, pl: 1 }}>
          <Typography variant="caption" color="text.secondary">
            선택된 판매자: {selectedSellerIds.length}명
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={handleApproveSelected}
          disabled={
            selectedSellerIds.length === 0 || approveSelectedMutation.isPending
          }
        >
          선택 승인
        </Button>
        <Button
          variant="contained"
          onClick={handleApproveBatch}
          disabled={approveBatchMutation.isPending}
        >
          미승인 전체 승인
        </Button>
        <Button onClick={handleClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellerApprovalDialog;
