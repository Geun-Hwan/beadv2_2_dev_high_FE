import { adminUserApi, type UserSearchFilter } from "@/apis/adminUserApi";
import { PAGE_SIZE } from "@/shared/constant/const";
import {
  getUserStatusLabel,
  SellerStatus,
  UserStatus,
  type AdminUser,
} from "@moreauction/types";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  Paper,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Pagination,
  MenuItem,
  Select,
} from "@mui/material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import SellerApprovalDialog from "../dialog/SellerApprovalDialog";
import UserDetailDialog from "../dialog/UserDetailDialog";

const statusOptions = [
  { value: "all", label: "전체" },
  ...Object.values(UserStatus).map((status) => ({
    value: status,
    label: getUserStatusLabel(status),
  })),
];

const sellerStatusOptions = [
  { value: SellerStatus.PENDING, label: "미승인" },
  { value: SellerStatus.ACTIVE, label: "승인" },
  { value: SellerStatus.INACTIVE, label: "비활성" },
  { value: SellerStatus.BLACKLISTED, label: "블랙리스트" },
  { value: SellerStatus.WITHDRAWN, label: "탈퇴" },
];

const getSellerStatusLabel = (status?: SellerStatus | null) => {
  const option = sellerStatusOptions.find((item) => item.value === status);
  return option?.label ?? status ?? "-";
};

const AdminUsers = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState<UserSearchFilter>({});
  const [draftFilters, setDraftFilters] = useState<UserSearchFilter>({});

  const usersQuery = useQuery({
    queryKey: ["admin", "users", page, statusFilter, filters],
    queryFn: () =>
      adminUserApi.getUsers({
        page: page - 1,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
        filter: {
          ...filters,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const totalPages = usersQuery.data?.totalPages ?? 1;
  const users = usersQuery.data?.content ?? [];

  const showEmpty =
    !usersQuery.isLoading && !usersQuery.isError && users.length === 0;
  const errorMessage = useMemo(() => {
    if (!usersQuery.isError) return null;
    return "유저 목록을 불러오지 못했습니다.";
  }, [usersQuery.isError]);

  return (
    <>
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
              유저 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회원 상태를 확인하고 관리합니다.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              fullWidth
              sx={{ minWidth: 140 }}
              onClick={() => setSellerDialogOpen(true)}
            >
              판매자 승인
            </Button>
            <Select
              size="small"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              sx={{ minWidth: 140 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={draftFilters.deletedYn ?? "all"}
              onChange={(event) => {
                const nextValue =
                  event.target.value === "all"
                    ? undefined
                    : (event.target.value as "Y" | "N");
                setDraftFilters((prev) => ({
                  ...prev,
                  deletedYn: nextValue,
                }));
                setFilters((prev) => ({
                  ...prev,
                  deletedYn: nextValue,
                }));
                setPage(1);
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">삭제 여부 전체</MenuItem>
              <MenuItem value="N">삭제 안됨</MenuItem>
              <MenuItem value="Y">삭제됨</MenuItem>
            </Select>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              필터
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="검색"
                size="small"
                placeholder="아이디/이메일/이름/닉네임/전화번호 검색"
                value={draftFilters.keyword ?? ""}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    keyword: event.target.value || undefined,
                  }))
                }
                fullWidth
              />
              <TextField
                label="가입일 시작"
                type="date"
                size="small"
                value={draftFilters.signupDateFrom ?? ""}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    signupDateFrom: event.target.value || undefined,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="가입일 종료"
                type="date"
                size="small"
                value={draftFilters.signupDateTo ?? ""}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    signupDateTo: event.target.value || undefined,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setDraftFilters({});
                  setFilters({});
                  setPage(1);
                }}
                size="small"
              >
                초기화
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setFilters({
                    ...draftFilters,
                  });
                  setPage(1);
                }}
                size="small"
              >
                필터 적용
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">유저 ID</TableCell>
                <TableCell align="center">이메일</TableCell>
                <TableCell align="center">이름</TableCell>
                <TableCell align="center">닉네임</TableCell>
                <TableCell align="center">전화번호</TableCell>
                <TableCell align="center">회원 상태</TableCell>
                <TableCell align="center">판매자 상태</TableCell>
                <TableCell align="center">삭제 여부</TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                "& tr:last-child td, & tr:last-child th": { borderBottom: 0 },
              }}
            >
              {usersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">
                      유저 목록을 불러오는 중...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {errorMessage && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Alert severity="error">{errorMessage}</Alert>
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ height: 56, cursor: "pointer" }}
                  onClick={() => {
                    setDetailTarget(user);
                    setDetailOpen(true);
                  }}
                >
                  <TableCell align="center">{user.id}</TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.email}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">{user.name ?? "-"}</TableCell>
                  <TableCell align="center">{user.nickname ?? "-"}</TableCell>
                  <TableCell align="center">
                    {user.phoneNumber ?? "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={getUserStatusLabel(user.userStatus ?? "")}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={getSellerStatusLabel(user.sellerStatus)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={user.deletedYn === "Y" ? "삭제됨" : "활성"}
                      color={user.deletedYn === "Y" ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {showEmpty && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary">
                      조건에 해당하는 유저가 없습니다.
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
      <SellerApprovalDialog
        open={sellerDialogOpen}
        onClose={() => setSellerDialogOpen(false)}
      />
      <UserDetailDialog
        open={detailOpen}
        user={detailTarget}
        onClose={() => setDetailOpen(false)}
        onExited={() => setDetailTarget(null)}
      />
    </>
  );
};

export default AdminUsers;
