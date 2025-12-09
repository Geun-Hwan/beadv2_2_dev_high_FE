import {
  Button, // Grid 추가
  Card, // Card 추가
  CardContent, // CardContent 추가
  CardMedia,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom"; // Link 추가
import { auctionApi, type AuctionQueryParams } from "../apis/auctionApi";

// 경매 항목 타입 정의
interface AuctionItem {
  auctionId: string; // 또는 number
  title: string;
  startBid: number;
  // TODO: 실제 API 응답에 따라 다른 필드 추가
  imageUrl?: string; // 이미지 URL 필드 추가 (임시)
}

// 경매 목록 API 응답 타입 정의 (페이징 포함)
interface AuctionListResponse {
  content: AuctionItem[];
  pageable: object; // 페이징 정보 (필요시 상세 타입 정의)
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: object;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

const Auctions: React.FC = () => {
  const [data, setData] = React.useState<AuctionListResponse | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [params, setParams] = React.useState<AuctionQueryParams>({}); // params 타입 지정

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data }: { data: AuctionListResponse } =
          await auctionApi.getAuctions(params); // 반환 타입 명시

        const itemsWithImages = data?.content?.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl ||
            `https://picsum.photos/seed/${item.auctionId}/300/200`, // 임시 이미지
        }));
        console.log(itemsWithImages);
        setData({ ...data, content: itemsWithImages }); // 여기서 상태 업데이트
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [params]);

  return (
    <Container>
      {/* App.tsx의 Container는 maxWidth="lg"를 유지하므로, Auctions 페이지도 lg 너비 안에서 중앙 정렬되도록 합니다. */}
      <Typography variant="h4" sx={{ my: 4 }}>
        경매 목록
      </Typography>
      <Grid container spacing={4}>
        {/* spacing으로 카드 간 간격 설정 */}
        {data?.content?.map((auction: AuctionItem) => (
          <Grid key={auction.auctionId}>
            {/* 한 줄에 4개씩 표시 */}
            <Card
              key={auction.auctionId}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardMedia
                height={200}
                width={300}
                component="img"
                image={auction.imageUrl}
                alt={auction.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {auction.title}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  현재가: {auction.startBid.toLocaleString()}원
                </Typography>
              </CardContent>
              <Button
                size="small"
                color="primary"
                component={RouterLink}
                to={`/auctions/${auction?.auctionId}`} // 경매 상세 페이지 링크
                sx={{ m: 1 }}
              >
                자세히 보기
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Auctions;
