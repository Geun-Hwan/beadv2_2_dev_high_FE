import {
  Alert,
  Chip,
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
import { getOrderStatusLabel, type OrderResponse } from "../../types/order";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type OrderFilter = "BOUGHT" | "SOLD";

interface OrdersTabProps {
  loading: boolean;
  error: string | null;
  sold: OrderResponse[];
  bought: OrderResponse[];
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  loading,
  error,
  sold,
  bought,
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<OrderFilter>("BOUGHT");

  const { label, list } = useMemo(() => {
    if (filter === "SOLD") {
      return { label: "판매 내역", list: sold };
    }
    return { label: "구매 내역", list: bought };
  }, [filter, bought, sold]);

  const showSkeleton = loading && !error && list.length === 0;

  // 에러가 있는 경우에는 목록 대신 에러만 표시
  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          주문 내역
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        주문 내역
      </Typography>

      <ToggleButtonGroup
        size="small"
        color="primary"
        value={filter}
        exclusive
        onChange={(_, v: OrderFilter | null) => {
          if (!v) return;
          setFilter(v);
        }}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="BOUGHT">구매 내역</ToggleButton>
        {user?.role !== "USER" && (
          <ToggleButton value="SOLD">판매 내역</ToggleButton>
        )}
      </ToggleButtonGroup>

      {showSkeleton ? (
        <List>
          {Array.from({ length: 3 }).map((_, idx) => (
            <React.Fragment key={idx}>
              <ListItem>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="80%" />}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : list.length === 0 ? (
        <Alert severity="info">
          {filter === "BOUGHT"
            ? "구매한 주문이 없습니다."
            : "판매한 주문이 없습니다."}
        </Alert>
      ) : (
        <List>
          {list.map((order) => {
            const depositAmount =
              typeof order.depositAmount === "number" ? order.depositAmount : 0;
            const finalPurchaseAmount =
              typeof order.depositAmount === "number"
                ? order.winningAmount - order.depositAmount
                : null;
            const confirmDateLabel = order.confirmDate
              ? new Date(order.confirmDate).toLocaleString()
              : null;
            const payCompleteDateLabel = order.payCompleteDate
              ? new Date(order.payCompleteDate).toLocaleString()
              : null;

            return (
              <React.Fragment key={order.id}>
                <ListItem
                  component={RouterLink}
                  to={`/orders/${order.id}`}
                  sx={{ cursor: "pointer" }}
                >
                  <ListItemText
                    primary={order.productName ?? "주문"}
                    secondary={[
                      filter === "BOUGHT"
                        ? finalPurchaseAmount != null
                          ? `최종 구매금액: ${finalPurchaseAmount.toLocaleString()}원`
                          : `낙찰가: ${order.winningAmount.toLocaleString()}원`
                        : `낙찰가: ${order.winningAmount.toLocaleString()}원`,
                      typeof order.depositAmount === "number"
                        ? `보증금: ${depositAmount.toLocaleString()}원`
                        : undefined,
                      `주문 ID: ${order.id}`,
                      confirmDateLabel
                        ? `주문일(낙찰확정): ${confirmDateLabel}`
                        : undefined,
                      payCompleteDateLabel
                        ? `구매완료일: ${payCompleteDateLabel}`
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  <Chip
                    label={getOrderStatusLabel(order.status)}
                    size="small"
                    color="default"
                    sx={{ ml: 2 }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
};
