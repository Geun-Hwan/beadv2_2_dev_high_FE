import {
  Alert,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { orderApi } from "../apis/orderApi";
import { OrderStatus, type OrderResponse } from "../types/order";
import { format } from "date-fns";

const PendingOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getBoughtOrders();
      const list = Array.isArray(res.data) ? res.data : [];
      // 구매 내역 중 결제 상태가 UNPAID인 주문만 필터링
      setOrders(list.filter((o) => o.status === OrderStatus.UNPAID));
    } catch (err) {
      console.error("결제 대기 주문 조회 실패:", err);
      setError("결제 대기 주문을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteByDeposit = async (orderId: string) => {
    if (actionLoadingId) return;
    if (!window.confirm("예치금으로 결제하시겠습니까?")) return;
    try {
      setActionLoadingId(orderId);
      await orderApi.completeOrderByDeposit(orderId);
      alert("결제가 완료되었습니다.");
      loadPendingOrders();
    } catch (err: any) {
      console.error("결제 실패:", err);
      alert(err?.data?.message ?? "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    loadPendingOrders();
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          결제 대기 주문서 (Pending Orders)
        </Typography>
        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Typography>로딩 중...</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : orders.length === 0 ? (
            <Alert severity="info">결제 대기 중인 주문이 없습니다.</Alert>
          ) : (
            <List>
              {orders.map((order) => (
                <ListItem
                  key={order.id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      size="small"
                      disabled={actionLoadingId === order.id}
                      onClick={() => handleCompleteByDeposit(order.id)}
                    >
                      {actionLoadingId === order.id
                        ? "처리 중..."
                        : "예치금으로 결제"}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={`주문 ID: ${
                      order.id
                    } - ${order.winningAmount.toLocaleString()}원`}
                    secondary={format(
                      new Date(order.createdAt),
                      "yyyy-MM-dd HH:mm"
                    )}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PendingOrders;
