import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  InputAdornment,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { auctionApi } from "../apis/auctionApi";
import type { AuctionDocument } from "../types/search";
import { ProductStatus, type ProductCategory } from "../types/product";
import { categoryApi } from "../apis/categoryApi";
import { getCommonStatusText } from "../utils/statusText";

const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // URL 쿼리에서 초기 검색 조건 읽기
  const initialKeyword = params.get("keyword") ?? "";
  const initialStatus = params.get("status") ?? "";
  const initialCategoryIds = params.getAll("categories");
  const initialPage = Number(params.get("page") ?? 0);

  // 입력용 상태 (폼에 바인딩)
  const [inputKeyword, setInputKeyword] = useState(initialKeyword);
  const [pendingStatus, setPendingStatus] = useState(initialStatus);
  const [pendingCategoryIds, setPendingCategoryIds] =
    useState<string[]>(initialCategoryIds);

  // 실제 검색에 사용되는 적용 상태
  const [keyword, setKeyword] = useState(initialKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<string[]>(initialCategoryIds);
  const [page, setPage] = useState(initialPage >= 0 ? initialPage : 0);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [result, setResult] = useState<{
    totalPages: number;
    content: AuctionDocument[];
  }>({
    totalPages: 0,
    content: [],
  });
  const [loading, setLoading] = useState(false);

  // 카테고리 목록 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await categoryApi.getCategories();
        setCategories(res.data);
      } catch (err) {
        console.error("카테고리 조회 실패:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 적용된 검색 조건이 바뀔 때 URL 동기화
  useEffect(() => {
    const hasFilter = !!keyword || !!status || selectedCategoryIds.length > 0;

    const newParams = new URLSearchParams();
    if (keyword) newParams.set("keyword", keyword);
    if (status) newParams.set("status", status);
    if (selectedCategoryIds.length > 0) {
      selectedCategoryIds.forEach((id) => newParams.append("categories", id));
    }

    if (hasFilter) {
      newParams.set("page", String(page));
      newParams.set("size", "20");
      navigate(`/search?${newParams.toString()}`, { replace: true });
    } else {
      navigate("/search", { replace: true });
    }
  }, [keyword, status, selectedCategoryIds, page, navigate]);

  // 적용된 검색 조건이 바뀔 때마다 검색 실행
  useEffect(() => {
    const fetchSearch = async () => {
      // 아무 조건이 없으면 검색하지 않음
      if (!keyword && !status && selectedCategoryIds.length === 0) {
        setResult({ totalPages: 0, content: [] });
        return;
      }

      setLoading(true);
      try {
        const data = await auctionApi.searchAuctions({
          keyword: keyword || undefined,
          status: status || undefined,
          categories:
            selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
          page,
          size: 20,
        });
        setResult({
          totalPages: data.data.totalPages,
          content: data.data.content,
        });
      } catch (error) {
        console.error("검색 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [keyword, status, selectedCategoryIds, page]);

  // 입력 핸들러들 (아직 검색 조건에는 적용하지 않음)
  const handleInputKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputKeyword(e.target.value);
  };

  const handlePendingStatusClick = (value: string) => {
    setPendingStatus((prev) => (prev === value ? "" : value));
  };

  const handlePendingCategoryClick = (id: string) => {
    setPendingCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 검색 버튼 / 폼 제출 시 실제 검색 조건을 적용
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = inputKeyword.trim();
    const hasFilter =
      !!trimmed || !!pendingStatus || pendingCategoryIds.length > 0;

    if (!hasFilter) {
      // 아무 조건도 없으면 검색하지 않음
      return;
    }

    setKeyword(trimmed);
    setStatus(pendingStatus);
    setSelectedCategoryIds(pendingCategoryIds);
    setPage(0);
  };

  const handlePageChange = (
    _: React.ChangeEvent<unknown>,
    value: number
  ): void => {
    setPage(value - 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        상품 / 경매 검색
      </Typography>

      {/* 검색어 + 검색 버튼 */}
      <Box sx={{ mb: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              placeholder="상품명, 설명 등으로 검색해 보세요."
              value={inputKeyword}
              onChange={handleInputKeywordChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ px: 3, py: 1.25, minWidth: 96 }}
            >
              검색
            </Button>
          </Stack>
        </form>
      </Box>

      {/* 상태 필터 (입력용, 검색 버튼으로 적용) */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          label="전체"
          clickable
          color={pendingStatus === "" ? "primary" : "default"}
          onClick={() => handlePendingStatusClick("")}
        />
        <Chip
          label="진행중"
          clickable
          color={
            pendingStatus === ProductStatus.IN_PROGESS ? "primary" : "default"
          }
          onClick={() => handlePendingStatusClick(ProductStatus.IN_PROGESS)}
        />
        <Chip
          label="대기중"
          clickable
          color={pendingStatus === ProductStatus.READY ? "primary" : "default"}
          onClick={() => handlePendingStatusClick(ProductStatus.READY)}
        />
        <Chip
          label="종료"
          clickable
          color={
            pendingStatus === ProductStatus.COMPLETE ? "primary" : "default"
          }
          onClick={() => handlePendingStatusClick(ProductStatus.COMPLETE)}
        />
      </Stack>

      {/* 카테고리 필터 (여러 개 선택 가능, 검색 버튼으로 적용) */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
        {categoriesLoading && categories.length === 0
          ? Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rounded"
                width={80}
                height={32}
                sx={{ borderRadius: 16, mb: 0.5 }}
              />
            ))
          : categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.categoryName}
                clickable
                color={
                  pendingCategoryIds.includes(cat.id) ? "secondary" : "default"
                }
                onClick={() => handlePendingCategoryClick(cat.id)}
                sx={{ mb: 0.5 }}
              />
            ))}
      </Stack>

      {/* 결과 영역 */}
      {!keyword && !status && selectedCategoryIds.length === 0 ? (
        <Typography color="text.secondary">
          검색어를 입력하거나 상태/카테고리를 선택한 뒤 검색 버튼을 눌러주세요.
        </Typography>
      ) : loading ? (
        <Typography>검색 중입니다...</Typography>
      ) : result.content.length === 0 ? (
        <Typography color="text.secondary">
          조건에 맞는 상품/경매를 찾지 못했습니다.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
            mb: 4,
          }}
        >
          {result.content.map((doc) => (
            <Card
              key={doc.id}
              sx={{
                height: 320,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={`/products/${doc.productId}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={doc.imageUrl || "/images/no_image.png"}
                  alt={doc.productName}
                  sx={{ objectFit: "cover", width: "100%" }}
                />
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      mb: 0.5,
                    }}
                  >
                    {doc.productName}
                  </Typography>
                  {doc.currentBid != null || doc.startBid != null ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, textAlign: "right" }}
                    >
                      {doc.currentBid != null
                        ? `현재가 ${doc.currentBid.toLocaleString()}원`
                        : `시작가 ${doc.startBid?.toLocaleString() ?? 0}원`}
                    </Typography>
                  ) : null}
                  <Box sx={{ mt: "auto", textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">
                      상태: {getCommonStatusText(doc.status)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Pagination
        count={result.totalPages}
        page={page + 1}
        onChange={handlePageChange}
        sx={{ display: "flex", justifyContent: "center" }}
      />
    </Container>
  );
};

export default SearchPage;
