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
  SettlementStatus,
  type SettlementResponse,
} from "@moreauction/types";
import { formatWon } from "@moreauction/utils";
import { adminSettlementApi } from "@/apis/adminSettlementApi";

const PAGE_SIZE = 10;

const settlementStatusLabels: Record<string, string> = {
  PENDING: "대기",
  COMPLETED: "완료",
};

const statusOptions = [
  { value: "all", label: "전체" },
  ...Object.values(SettlementStatus).map((status) => ({
    value: status,
    label: settlementStatusLabels[status] ?? status,
  })),
];

const AdminSettlements = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const settlementsQuery = useQuery({
    queryKey: ["admin", "settlements", page, statusFilter],
    queryFn: () =>
      adminSettlementApi.getSettlements({
        page: page - 1,
        size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 20_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: string; status: SettlementStatus }) =>
      adminSettlementApi.updateSettlement(params.id, {
        status: params.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminSettlementApi.deleteSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
    },
  });

  const totalPages = settlementsQuery.data?.totalPages ?? 1;
  const settlements = settlementsQuery.data?.content ?? [];

  const showEmpty = !settlementsQuery.isLoading && settlements.length === 0;
  const errorMessage = useMemo(() => {
    if (!settlementsQuery.isError) return null;
    return "정산 목록을 불러오지 못했습니다.";
  }, [settlementsQuery.isError]);

  const handleStatusChange = (
    settlement: SettlementResponse,
    next: SettlementStatus
  ) => {
    if (settlement.status === next) return;
    updateStatusMutation.mutate({ id: settlement.id, status: next });
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
            정산 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            정산 상태를 확인하고 수동 처리합니다.
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
              <TableCell>정산 ID</TableCell>
              <TableCell>주문 ID</TableCell>
              <TableCell>정산 금액</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>예정일</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settlements.map((settlement) => (
              <TableRow key={settlement.id} hover>
                <TableCell>{settlement.id}</TableCell>
                <TableCell>{settlement.orderId}</TableCell>
                <TableCell>{formatWon(settlement.finalAmount)}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={settlement.status}
                    onChange={(event) =>
                      handleStatusChange(
                        settlement,
                        event.target.value as SettlementStatus
                      )
                    }
                    sx={{ minWidth: 120 }}
                  >
                    {Object.values(SettlementStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {settlementStatusLabels[status] ?? status}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={settlement.dueDate?.slice(0, 10) ?? "-"}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      if (window.confirm("해당 정산을 삭제하시겠습니까?")) {
                        deleteMutation.mutate(settlement.id);
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
                    조건에 해당하는 정산이 없습니다.
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

export default AdminSettlements;
