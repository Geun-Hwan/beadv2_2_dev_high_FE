import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Container,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Chip,
} from "@mui/material";
import { useStomp } from "../hooks/useStomp";
import type { IMessage } from "@stomp/stompjs";

const AuctionDetail: React.FC = () => {
  const { id: auctionId } = useParams<{ id: string }>();
  const [currentUsers, setCurrentUsers] = useState(0);

  const [bids, setBids] = useState<
    { bidder: string; price: number; timestamp: string }[]
  >([]);
  const [newBid, setNewBid] = useState("");
  // 메시지 수신 처리 콜백
  const handleNewMessage = (message: IMessage) => {
    try {
      const payload = JSON.parse(message.body);

      switch (payload.type) {
        case "USER_JOIN":
          console.log("사용자 입장, 현재 인원:", payload.currentUsers);
          // UI 업데이트: 예를 들어 setUserCount(payload.currentUsers)
          setCurrentUsers(payload.currentUsers);
          break;

        case "USER_LEAVE":
          console.log("사용자 퇴장, 현재 인원:", payload.currentUsers);
          setCurrentUsers(payload.currentUsers);
          // UI 업데이트
          break;

        case "BID_SUCCESS":
          console.log(
            "최고 입찰자:",
            payload.highestUserId,
            "가격:",
            payload.bidPrice
          );
          // UI 업데이트: 예를 들어 setHighestBid(payload)
          break;

        default:
          console.warn("알 수 없는 메시지 타입:", payload);
      }
    } catch (error) {
      console.error("수신된 메시지를 파싱할 수 없습니다:", message.body, error);
    }
  };

  const handleBidSubmit = () => {};

  // useStomp 훅 사용
  const { isConnected, sendMessage } = useStomp({
    topic: "auction", // 이 경매를 위한 고유한 토픽
    onMessage: handleNewMessage,
    auctionId: auctionId || "",
  });

  // const handleBidSubmit = (event: React.FormEvent) => {
  //   event.preventDefault();
  //   const price = parseInt(newBid, 10);
  //   if (!price || price <= 0) {
  //     alert("올바른 입찰 금액을 입력해주세요.");
  //     return;
  //   }

  //   // 메시지 전송
  // };

  return (
    <Container>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 4 }}>
        <Typography variant="h4">경매 상세 (ID: {auctionId})</Typography>
        <Chip
          label={isConnected ? "실시간 연결 중" : "연결 끊김"}
          color={isConnected ? "success" : "error"}
        />
        <Typography variant="subtitle1">
          현재 보고있는 유저: {currentUsers}명
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">실시간 입찰 현황</Typography>
        <List sx={{ maxHeight: 400, overflow: "auto" }}>
          {bids?.length === 0 && (
            <ListItem>
              <ListItemText primary="아직 입찰 내역이 없습니다." />
            </ListItem>
          )}
          {bids?.map((bid, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`${
                  bid.bidder
                }님의 입찰: ${bid.price.toLocaleString()}원`}
                secondary={new Date(bid.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {isConnected && (
        <Paper sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleBidSubmit}
            sx={{ display: "flex", gap: 2 }}
          >
            <TextField
              type="number"
              label="입찰 금액"
              value={newBid}
              onChange={(e) => setNewBid(e.target.value)}
              fullWidth
            />
            <Button type="submit" variant="contained">
              입찰
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default AuctionDetail;
