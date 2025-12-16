import {
  Alert,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { DepositType, type DepositHistory } from "../../types/deposit";

type HistoryFilter = "ALL" | "CHARGE" | "USAGE";

interface DepositHistoryTabProps {
  loading: boolean;
  error: string | null;
  history: DepositHistory[];
}

const typeMap = {
  CHARGE: "충전",
  USAGE: "사용",
  ALL: "예치금",
};

export const DepositHistoryTab: React.FC<DepositHistoryTabProps> = ({
  loading,
  error,
  history,
}) => {
  const [filter, setFilter] = useState<HistoryFilter>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return history;
    const type: DepositType = filter === "CHARGE" ? "CHARGE" : "USAGE";
    return history.filter((h) => h.type === type);
  }, [history, filter]);

  const showSkeleton = loading && !error && history.length === 0;

  // 에러가 있는 경우에는 목록 대신 에러만 표시
  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          예치금 내역
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        예치금 내역
      </Typography>

      <ToggleButtonGroup
        size="small"
        color="primary"
        value={filter}
        exclusive
        onChange={(_, v: HistoryFilter | null) => {
          if (!v) return;
          setFilter(v);
        }}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="ALL">전체</ToggleButton>
        <ToggleButton value="CHARGE">충전</ToggleButton>
        <ToggleButton value="USAGE">사용</ToggleButton>
      </ToggleButtonGroup>

      {showSkeleton ? (
        <List>
          {Array.from({ length: 3 }).map((_, idx) => (
            <React.Fragment key={idx}>
              <ListItem>
                <ListItemText
                  primary={<Skeleton width="50%" />}
                  secondary={<Skeleton width="80%" />}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{typeMap[filter]} 내역이 없습니다.</Alert>
      ) : (
        <List>
          {filtered.map((hst) => (
            <React.Fragment key={hst.id}>
              <ListItem>
                <ListItemText
                  primary={`${new Date(hst.createdAt).toLocaleString()}`}
                  secondary={`${
                    hst.type === "CHARGE" ? "충전" : "사용"
                  } 금액: ${hst.amount.toLocaleString()}원 (잔액: ${hst.balance.toLocaleString()}원)`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};
