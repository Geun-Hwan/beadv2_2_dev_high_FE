import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  Stack,
  Alert,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  OrderStatus,
  getOrderStatusLabel,
  type OrderResponse,
} from "@moreauction/types";
import { formatWon } from "@moreauction/utils";
import { adminOrderApi } from "@/apis/adminOrderApi";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "all", label: "전체" },
  ...Object.values(OrderStatus).map((status) => ({
    value: status,
    label: getOrderStatusLabel(status),
  })),
];

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", page, statusFilter],
    queryFn: () =>
      adminOrderApi.getOrders({
        page: page - 1,
        size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 20_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params: { orderId: string; status: OrderStatus }) =>
      adminOrderApi.updateOrder(params.orderId, { status: params.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => adminOrderApi.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const orders = ordersQuery.data?.content ?? [];

  const showEmpty = !ordersQuery.isLoading && orders.length === 0;
  const errorMessage = useMemo(() => {
    if (!ordersQuery.isError) return null;
    return "주문 목록을 불러오지 못했습니다.";
  }, [ordersQuery.isError]);

  const handleStatusChange = (order: OrderResponse, next: OrderStatus) => {
    if (order.status === next) return;
    updateStatusMutation.mutate({ orderId: order.id, status: next });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            주문 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            낙찰 주문 상태를 확인하고 업데이트합니다.
          </Typography>
        </Box>
        <Select
          size="small"
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Paper variant="outlined">
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>주문 ID</TableCell>
              <TableCell>상품명</TableCell>
              <TableCell>낙찰가</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>등록일</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.productName ?? "-"}</TableCell>
                <TableCell>{formatWon(order.winningAmount)}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={order.status}
                    onChange={(event) =>
                      handleStatusChange(order, event.target.value as OrderStatus)
                    }
                    sx={{ minWidth: 140 }}
                  >
                    {Object.values(OrderStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {getOrderStatusLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={order.createdAt?.slice(0, 10) ?? "-"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      if (window.confirm("해당 주문을 삭제하시겠습니까?")) {
                        deleteMutation.mutate(order.id);
                      }
                    }}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {showEmpty && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">
                    조건에 해당하는 주문이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default AdminOrders;
