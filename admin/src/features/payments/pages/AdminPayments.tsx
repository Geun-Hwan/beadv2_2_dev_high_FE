import { adminPaymentsApi } from "@/apis/adminPaymentsApi";
import { PAGE_SIZE } from "@/shared/constant/const";
import { formatWon } from "@moreauction/utils";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type {
  CancelPaymentRequest,
  DepositOrderInfo,
  DepositOrderStatus,
  DepositOrderType,
} from "@moreauction/types";

type FilterState = {
  id: string;
  userId: string;
  status: string;
  type: string;
};

const emptyFilters: FilterState = {
  id: "",
  userId: "",
  status: "all",
  type: "all",
};

const orderStatusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "전체" },
  ...(
    ["PENDING", "COMPLETED", "FAILED", "CANCEL_PENDING", "CANCELLED"] as const
  ).map((status) => ({
    value: status,
    label: (() => {
      switch (status) {
        case "PENDING":
          return "대기";
        case "COMPLETED":
          return "완료";
        case "FAILED":
          return "실패";
        case "CANCEL_PENDING":
          return "환불 대기중";
        case "CANCELLED":
          return "취소";
        default:
          return status;
      }
    })(),
  })),
];

const orderTypeOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "전체" },
  ...(["DEPOSIT_CHARGE", "ORDER_PAYMENT"] as const).map((type) => ({
    value: type,
    label: type === "DEPOSIT_CHARGE" ? "예치금 충전" : "주문 결제",
  })),
];

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const [ordersPage, setOrdersPage] = useState(1);
  const [orderFilters, setOrderFilters] = useState<FilterState>(emptyFilters);
  const [orderDrafts, setOrderDrafts] = useState<FilterState>(emptyFilters);
  const [cancelPendingOpen, setCancelPendingOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<DepositOrderInfo | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["admin", "payment-orders", ordersPage, orderFilters],
    queryFn: () =>
      adminPaymentsApi.getDepositOrders({
        page: ordersPage - 1,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
        id: orderFilters.id || undefined,
        userId: orderFilters.userId || undefined,
        status:
          orderFilters.status === "all"
            ? undefined
            : (orderFilters.status as DepositOrderStatus),
        type:
          orderFilters.type === "all"
            ? undefined
            : (orderFilters.type as DepositOrderType),
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const orderPageData = ordersQuery.data?.data ?? null;
  const orderRows = orderPageData?.content ?? [];
  const ordersTotalPages = orderPageData?.totalPages ?? 1;

  const ordersError = useMemo(
    () =>
      ordersQuery.isError ? "주문 결제 내역을 불러오지 못했습니다." : null,
    [ordersQuery.isError],
  );

  const applyFilters = () => {
    setOrderFilters({ ...orderDrafts });
    setOrdersPage(1);
  };

  const resetFilters = () => {
    setOrderDrafts(emptyFilters);
    setOrderFilters(emptyFilters);
    setOrdersPage(1);
  };

  const cancelPendingQuery = useQuery({
    queryKey: ["admin", "payment-orders", "cancel-pending"],
    queryFn: () =>
      adminPaymentsApi.getDepositOrders({
        page: 0,
        size: 50,
        sort: "createdAt,desc",
        status: "CANCEL_PENDING",
      }),
    enabled: cancelPendingOpen,
    staleTime: 10_000,
  });

  const cancelPendingRows = cancelPendingQuery.data?.data?.content ?? [];
  const cancelPendingError = useMemo(
    () =>
      cancelPendingQuery.isError
        ? "환불 대기 주문을 불러오지 못했습니다."
        : null,
    [cancelPendingQuery.isError],
  );

  const cancelOrderMutation = useMutation({
    mutationFn: (payload: CancelPaymentRequest) =>
      adminPaymentsApi.cancelPaymentOrders(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "payment-orders", "cancel-pending"],
      });
      setDetailOrder((prev) =>
        prev ? { ...prev, status: response.data?.status ?? "CANCELLED" } : prev,
      );
    },
  });

  const HIDE_STATUSES = new Set<keyof typeof DepositOrderStatus>([
    "PENDING",
    "FAILED",
    "CANCELLED",
  ]);

  const openConfirmCancel = (orderId: string) => {
    setConfirmCancelId(orderId);
    setConfirmCancelOpen(true);
  };

  const closeConfirmCancel = () => {
    if (cancelOrderMutation.isPending) return;
    setConfirmCancelOpen(false);
    setConfirmCancelId(null);
  };

  const normalizeStatus = (status?: DepositOrderStatus | null) =>
    status ? String(status).trim().toUpperCase() : "-";
  const normalizeType = (type?: DepositOrderType | null) =>
    type ? String(type).trim().toUpperCase() : "-";

  const getOrderStatusLabel = (status?: DepositOrderStatus | null) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "PENDING":
        return "대기";
      case "COMPLETED":
        return "완료";
      case "FAILED":
        return "실패";
      case "CANCEL_PENDING":
        return "환불 대기중";
      case "CANCELLED":
        return "취소";
      default:
        return normalized;
    }
  };

  const getOrderTypeLabel = (type?: DepositOrderType | null) => {
    const normalized = normalizeType(type);
    if (normalized === "DEPOSIT_CHARGE") return "예치금 충전";
    if (normalized === "ORDER_PAYMENT") return "주문 결제";
    return normalized;
  };

  const renderOrdersTable = () => (
    <Paper variant="outlined">
      {ordersError ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{ordersError}</Alert>
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">주문 ID</TableCell>
              <TableCell align="center">사용자</TableCell>
              <TableCell align="center">유형</TableCell>
              <TableCell align="center">총 금액</TableCell>
              <TableCell align="center">예치금</TableCell>
              <TableCell align="center">실결제</TableCell>
              <TableCell align="center">상태</TableCell>

              <TableCell align="center">생성일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordersQuery.isLoading && orderRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography color="text.secondary">
                    주문 결제 내역을 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : orderRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography color="text.secondary">
                    주문 결제 내역이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orderRows.map((row: DepositOrderInfo) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    setDetailOrder(row);
                  }}
                >
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell align="center">{row.userId}</TableCell>
                  <TableCell align="center">
                    {getOrderTypeLabel(row.type)}
                  </TableCell>
                  <TableCell align="center">
                    {formatWon(row.amount ?? 0)}
                  </TableCell>
                  <TableCell align="center">
                    {typeof row.deposit === "number"
                      ? formatWon(row.deposit)
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {typeof row.paidAmount === "number"
                      ? formatWon(row.paidAmount)
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {getOrderStatusLabel(row.status)}
                  </TableCell>

                  <TableCell align="center">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              결제 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              예치금 결제/주문 이력을 확인합니다.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => setCancelPendingOpen(true)}>
            환불 대기 보기
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            필터
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="주문 ID"
              size="small"
              value={orderDrafts.id}
              onChange={(event) =>
                setOrderDrafts((prev) => ({
                  ...prev,
                  id: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="사용자 ID"
              size="small"
              value={orderDrafts.userId}
              onChange={(event) =>
                setOrderDrafts((prev) => ({
                  ...prev,
                  userId: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="상태"
              size="small"
              select
              value={orderDrafts.status}
              onChange={(event) =>
                setOrderDrafts((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
              fullWidth
            >
              {orderStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="주문 타입"
              size="small"
              select
              value={orderDrafts.type}
              onChange={(event) =>
                setOrderDrafts((prev) => ({
                  ...prev,
                  type: event.target.value,
                }))
              }
              fullWidth
            >
              {orderTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }} />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" variant="outlined" onClick={resetFilters}>
              초기화
            </Button>
            <Button size="small" variant="contained" onClick={applyFilters}>
              필터 적용
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {renderOrdersTable()}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.max(ordersTotalPages, 1)}
          page={ordersPage}
          onChange={(_, value) => setOrdersPage(value)}
          color="primary"
        />
      </Box>

      <Dialog
        open={cancelPendingOpen}
        onClose={() => setCancelPendingOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>환불 요청</DialogTitle>
        <DialogContent dividers>
          {cancelPendingError ? (
            <Alert severity="error">{cancelPendingError}</Alert>
          ) : cancelPendingQuery.isLoading ? (
            <Typography color="text.secondary">
              환불 요청 불러오는 중...
            </Typography>
          ) : cancelPendingRows.length === 0 ? (
            <Typography color="text.secondary">
              환불 요청이 없습니다.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">주문 ID</TableCell>
                  <TableCell align="center">사용자</TableCell>
                  <TableCell align="center">유형</TableCell>
                  <TableCell align="center">총 금액</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cancelPendingRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell align="center">{row.id}</TableCell>
                    <TableCell align="center">{row.userId}</TableCell>
                    <TableCell align="center">
                      {getOrderTypeLabel(row.type)}
                    </TableCell>
                    <TableCell align="center">
                      {formatWon(row.amount ?? 0)}
                    </TableCell>
                    <TableCell align="center">
                      {getOrderStatusLabel(row.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="warning"
                        disabled={cancelOrderMutation.isPending}
                        onClick={() => openConfirmCancel(row.id)}
                      >
                        결제 취소
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelPendingOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>주문 결제 상세</DialogTitle>
        <DialogContent dividers>
          {detailOrder ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                주문 ID
              </Typography>
              <Typography>{detailOrder.id}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                사용자 ID
              </Typography>
              <Typography>{detailOrder.userId}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                유형
              </Typography>
              <Typography>{getOrderTypeLabel(detailOrder.type)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                상태
              </Typography>
              <Typography>{getOrderStatusLabel(detailOrder.status)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                총 금액
              </Typography>
              <Typography>{formatWon(detailOrder.amount ?? 0)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                예치금 사용
              </Typography>
              <Typography>
                {typeof detailOrder.deposit === "number"
                  ? formatWon(detailOrder.deposit)
                  : "-"}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                실결제 금액
              </Typography>
              <Typography>
                {typeof detailOrder.paidAmount === "number"
                  ? formatWon(detailOrder.paidAmount)
                  : "-"}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                생성일
              </Typography>
              <Typography>
                {detailOrder.createdAt
                  ? new Date(detailOrder.createdAt).toLocaleString()
                  : "-"}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOrder(null)}>닫기</Button>
          {detailOrder && !HIDE_STATUSES.has(detailOrder.status as any) && (
            <Button
              variant="contained"
              color="warning"
              disabled={cancelOrderMutation.isPending}
              onClick={() => openConfirmCancel(detailOrder.id)}
            >
              결제 취소
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmCancelOpen}
        onClose={closeConfirmCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>결제 취소 확인</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            주문 결제를 취소하면 환불 처리로 진행됩니다. 계속하시겠습니까?
          </Typography>
          {confirmCancelId && (
            <Typography sx={{ mt: 1 }}>주문 ID: {confirmCancelId}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmCancel}>닫기</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={cancelOrderMutation.isPending || !confirmCancelId}
            onClick={() => {
              if (!confirmCancelId) return;
              cancelOrderMutation.mutate({
                id: confirmCancelId,
                cancelReason: "관리자에 의한 취소",
              });
              closeConfirmCancel();
            }}
          >
            결제 취소
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPayments;
