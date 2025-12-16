// pages/payment/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { depositApi } from "../../apis/depositApi";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [title, setTitle] = useState("결제를 처리하고 있어요");
  const [description, setDescription] = useState(
    "결제 승인 중입니다. 잠시만 기다려 주세요."
  );

  useEffect(() => {
    const approvePayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentKey = params.get("paymentKey");
      const orderId = params.get("orderId");
      const amountParam = params.get("amount");
      const amount = amountParam ? Number(amountParam) : NaN;

      if (!paymentKey || !orderId || Number.isNaN(amount)) {
        setStatus("error");
        setTitle("결제 정보를 확인할 수 없어요");
        setDescription(
          "결제 요청 정보가 올바르지 않습니다. 다시 시도해 주세요."
        );
        return;
      }

      try {
        await depositApi.paymentSuccess({ paymentKey, orderId, amount });
        setStatus("success");
        setTitle("결제가 완료되었어요");
        setDescription(
          "예치금이 충전되었습니다. 마이페이지에서 잔액과 내역을 확인할 수 있어요."
        );
      } catch (err) {
        setStatus("error");
        setTitle("결제 승인에 실패했어요");
        setDescription(
          "결제가 정상적으로 승인되지 않았습니다. 결제 내역을 확인하거나 잠시 후 다시 시도해 주세요."
        );
      }

      setTimeout(() => {
        navigate("/mypage?tab=1", { replace: true });
      }, 5000);
    };

    approvePayment();
  }, []);

  const handleGoMyPage = () => {
    navigate("/mypage?tab=1", { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box sx={{ mb: 2 }}>
          {status === "loading" && <CircularProgress />}
          {status === "success" && (
            <CheckCircleOutline color="success" sx={{ fontSize: 48 }} />
          )}
          {status === "error" && (
            <ErrorOutline color="error" sx={{ fontSize: 48 }} />
          )}
        </Box>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
          잠시 후 마이페이지(예치금 탭)로 이동합니다.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleGoMyPage}>
          마이페이지로 바로가기
        </Button>
      </Paper>
    </Container>
  );
}
