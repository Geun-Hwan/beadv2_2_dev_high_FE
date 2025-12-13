import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { auctionApi } from "../apis/auctionApi";
import { categoryApi } from "../apis/categoryApi";
import { fileApi } from "../apis/fileApi";
import { productApi } from "../apis/productApi";
import { useAuth } from "../contexts/AuthContext";
import type {
  Auction,
  AuctionDetailResponse,
  AuctionUpdateRequest,
} from "../types/auction";
import { AuctionStatus } from "../types/auction";
import type {
  ProductCategory,
  ProductCreationRequest,
  ProductUpdateRequest,
} from "../types/product";
import {
  addHours,
  format,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns";
import { ko } from "date-fns/locale";

interface ProductAuctionFormData {
  name: string;
  description: string;
  startBid: number;
  auctionStartAt: string;
  auctionEndAt: string;
}

const ProductRegistration: React.FC = () => {
  const { productId, auctionId } = useParams<{
    productId?: string;
    auctionId?: string;
  }>();
  const isEditMode = !!(productId || auctionId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductAuctionFormData>();

  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setAllCategories(response.data);
      } catch (err) {
        console.error("카테고리 목록 로딩 실패:", err);
        setError("카테고리 목록을 불러오는 데 실패했습니다.");
      }
    };

    const fetchData = async () => {
      if (!productId && !auctionId) {
        // 신규 등록 - 기본 시간 설정
        const nextHour = setMilliseconds(
          setSeconds(setMinutes(addHours(new Date(), 1), 0), 0),
          0
        );

        reset({
          auctionStartAt: format(nextHour, "yyyy-MM-dd HH:mm", { locale: ko }),
          auctionEndAt: format(
            nextHour.setDate(nextHour.getDate() + 1),
            "yyyy-MM-dd HH:mm",
            { locale: ko }
          ),
        });
        return;
      }

      setLoading(true);
      try {
        let productData: any = null;
        let auctionData: AuctionDetailResponse | null = null;

        // 상품 ID로 조회
        if (productId) {
          const productResponse = await productApi.getProductByIdWithCategories(
            productId
          );
          productData = productResponse.data;

          // 상품의 경매 목록 조회
          const auctionsResponse = await auctionApi.getAuctionsByProductId(
            productId
          );
          const auctions = Array.isArray(auctionsResponse.data.content)
            ? auctionsResponse.data.content
            : auctionsResponse.data;

          // 수정 가능한 경매 찾기 (READY 상태)
          auctionData =
            auctions.find(
              (auction: Auction) => auction.status === AuctionStatus.READY
            ) || null;
        }
        // 경매 ID로 조회
        else if (auctionId) {
          const auctionResponse = await auctionApi.getAuctionDetail(auctionId);
          auctionData = auctionResponse.data;

          // 경매의 상품 정보 조회
          const productResponse = await productApi.getProductByIdWithCategories(
            auctionData.productId
          );
          productData = productResponse.data;
        }

        // 권한 체크
        if (user?.role !== "ADMIN" && user?.id !== productData.sellerId) {
          alert("수정할 권한이 없습니다.");
          navigate("/");
          return;
        }

        // 경매 상태 체크 (수정 모드에서만)
        if (auctionData && auctionData.status !== AuctionStatus.READY) {
          alert("대기 중인 경매만 수정할 수 있습니다.");
          navigate("/");
          return;
        }

        // 폼 데이터 설정
        reset({
          name: productData.name,
          description: productData.description,
          startBid: auctionData?.startBid || 1000,
          auctionStartAt:
            auctionData?.auctionStartAt.slice(0, 16) ||
            format(
              setMilliseconds(
                setSeconds(setMinutes(addHours(new Date(), 1), 0), 0),
                0
              ),
              "yyyy-MM-dd HH:mm",
              { locale: ko }
            ),
          auctionEndAt:
            auctionData?.auctionEndAt.slice(0, 16) ||
            format(
              setMilliseconds(
                setSeconds(setMinutes(addHours(new Date(), 25), 0), 0),
                0
              ),
              "yyyy-MM-dd HH:mm",
              { locale: ko }
            ),
        });

        // 카테고리 설정
        const selectedCategoryIds: string[] =
          productData.categories?.map((cat: any) => {
            if (typeof cat === "object" && "id" in cat) {
              return (cat as ProductCategory).id;
            }
            return cat as string;
          }) ?? [];
        setSelectedCategoryIds(selectedCategoryIds);
      } catch (err) {
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchData();
  }, [productId, auctionId, navigate, reset, user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setFileId(null);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = event.target.name;
    if (event.target.checked) {
      setSelectedCategoryIds((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const onSubmit = async (data: ProductAuctionFormData) => {
    if (selectedCategoryIds.length === 0) {
      setError("하나 이상의 카테고리를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    let uploadedFileId = fileId;

    try {
      // 파일 업로드
      if (selectedFile) {
        const fileUploadResponse = await fileApi.uploadFile(selectedFile);
        uploadedFileId = fileUploadResponse.data.id;
        if (!uploadedFileId) {
          throw new Error("파일 ID를 받아오지 못했습니다.");
        }
      }

      const auctionStart = format(data.auctionStartAt, "yyyy-MM-dd HH:mm:00", {
        locale: ko,
      });
      const auctionEnd = format(data.auctionEndAt, "yyyy-MM-dd HH:mm:00", {
        locale: ko,
      });

      if (isEditMode) {
        // 수정 모드
        if (productId) {
          // 상품 ID로 수정 - 상품과 경매 모두 수정
          const productData: ProductUpdateRequest = {
            name: data.name,
            description: data.description,
            fileId: uploadedFileId ?? undefined,
            categoryIds: selectedCategoryIds,
            sellerId: user?.id ?? "ADM00000001",
          };
          await productApi.updateProduct(productId, productData);

          // 연결된 경매가 있는지 확인하고 수정
          const auctionsResponse = await auctionApi.getAuctionsByProductId(
            productId
          );
          const auctions = Array.isArray(auctionsResponse.data.content)
            ? auctionsResponse.data.content
            : auctionsResponse.data;
          const readyAuction = auctions.find(
            (auction: Auction) => auction.status === AuctionStatus.READY
          );

          if (readyAuction) {
            const auctionData: AuctionUpdateRequest = {
              startBid: Number(data.startBid),
              auctionStartAt: auctionStart,
              auctionEndAt: auctionEnd,
            };
            await auctionApi.updateAuction(readyAuction.auctionId, auctionData);
          }
          alert("상품과 경매가 성공적으로 수정되었습니다.");
          navigate(`/products/${productId}`);
        } else if (auctionId) {
          // 경매 ID로 수정 - 경매와 연결된 상품 모두 수정
          const auctionResponse = await auctionApi.getAuctionDetail(auctionId);
          const auction = auctionResponse.data;

          const productData: ProductUpdateRequest = {
            name: data.name,
            description: data.description,
            fileId: uploadedFileId ?? undefined,
            categoryIds: selectedCategoryIds,
            sellerId: user?.id ?? "ADM00000001",
          };
          await productApi.updateProduct(auction.productId, productData);

          const auctionData: AuctionUpdateRequest = {
            startBid: Number(data.startBid),
            auctionStartAt: auctionStart,
            auctionEndAt: auctionEnd,
          };
          await auctionApi.updateAuction(auctionId, auctionData);

          alert("상품과 경매가 성공적으로 수정되었습니다.");
          navigate(`/auctions/${auctionId}`);
        }
      } else {
        // 신규 등록 - 상품과 경매 함께 생성
        const productData: ProductCreationRequest = {
          name: data.name,
          description: data.description,
          fileId: uploadedFileId ?? undefined,
          categoryIds: selectedCategoryIds,
          sellerId: user?.id ?? "ADM00000001",
        };

        const productResponse = await productApi.createProduct(productData);
        const createdProduct = productResponse.data;

        // 상품 생성 후 경매 생성
        const auctionData = {
          productId: createdProduct.id,
          startBid: Number(data.startBid),
          auctionStartAt: auctionStart,
          auctionEndAt: auctionEnd,
        };

        const auctionResponse = await auctionApi.createAuction(auctionData);
        alert("상품과 경매가 성공적으로 등록되었습니다.");
        navigate(`/auctions/${auctionResponse.data.auctionId}`);
      }
    } catch (err: any) {
      console.error("처리 실패:", err);
      setError(err.response?.data?.message || "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "SELLER" && user?.role !== "ADMIN" && !isEditMode) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ my: 4 }}>
          상품 및 경매 등록
        </Typography>
        <Alert severity="error">
          상품과 경매를 등록할 권한이 없습니다. 판매자 또는 관리자만 등록할 수
          있습니다.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ my: 4 }}>
        {isEditMode ? "상품 및 경매 수정" : "상품 및 경매 등록"}
      </Typography>
      <Paper sx={{ p: 4, boxShadow: 2 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ mt: 1 }}
        >
          {/* 상품 정보 섹션 */}
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
          >
            상품 정보
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="상품명"
            autoFocus
            {...register("name", { required: "상품명은 필수입니다." })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="description"
            label="상품 설명"
            multiline
            rows={4}
            {...register("description", {
              required: "상품 설명은 필수입니다.",
            })}
            error={!!errors.description}
            helperText={errors.description?.message}
          />

          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">카테고리</FormLabel>
            <FormGroup row>
              {allCategories.map((category) => (
                <FormControlLabel
                  key={category.id}
                  control={
                    <Checkbox
                      onChange={handleCategoryChange}
                      name={category.id}
                      checked={selectedCategoryIds.includes(category.id)}
                    />
                  }
                  label={category.categoryName}
                />
              ))}
            </FormGroup>
          </FormControl>

          {/* 이미지 업로드 섹션 */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              상품 이미지
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  py: 3,
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                  },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  📷
                </Typography>
                <Typography variant="body1">이미지 업로드</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  클릭하여 상품 이미지를 선택하세요
                </Typography>
                <input type="file" hidden onChange={handleFileChange} />
              </Button>

              {preview && (
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: "#fafafa",
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, color: "text.secondary", fontWeight: "bold" }}
                  >
                    📸 미리보기
                  </Typography>
                  <img
                    src={preview}
                    alt="상품 이미지 미리보기"
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setFileId(null);
                    }}
                  >
                    이미지 제거
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* 경매 정보 섹션 */}
          <Typography
            variant="h6"
            sx={{ mb: 2, mt: 4, fontWeight: "bold", color: "primary.main" }}
          >
            경매 정보
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="startBid"
              label="시작 입찰가 (100원 단위)"
              type="number"
              {...register("startBid", {
                required: "시작 입찰가는 필수입니다.",
                validate: (v) => {
                  if (v <= 0) return "시작 입찰가는 0보다 커야 합니다";
                  if (v % 100 !== 0) return "100원 단위로 입력해주세요";
                  return true;
                },
                valueAsNumber: true,
                setValueAs: (v) => Math.round(Number(v) / 100) * 100,
              })}
              error={!!errors.startBid}
              helperText={errors.startBid?.message}
              slotProps={{
                input: {
                  inputProps: {
                    min: 0,
                    step: 100,
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="auctionStartAt"
              label="경매 시작 시간"
              type="datetime-local"
              {...register("auctionStartAt", {
                required: "경매 시작 시간은 필수입니다.",
                validate: (v) => {
                  const date = new Date(v);
                  if (isNaN(date.getTime()))
                    return "올바른 날짜를 입력해주세요";
                  if (date < new Date() && !isEditMode)
                    return "현재 이후 시간만 선택 가능합니다";
                  if (date.getMinutes() !== 0)
                    return "정각 단위로 입력해주세요";
                  return true;
                },
              })}
              error={!!errors.auctionStartAt}
              helperText={
                errors.auctionStartAt?.message || "예: 연-월-일 12:00"
              }
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="auctionEndAt"
              label="경매 종료 시간"
              type="datetime-local"
              {...register("auctionEndAt", {
                required: "경매 종료 시간은 필수입니다.",
                validate: (v) => {
                  const start = new Date(watch("auctionStartAt"));
                  const end = new Date(v);
                  if (isNaN(end.getTime())) return "올바른 날짜를 입력해주세요";
                  if (end <= start)
                    return "종료 시간은 시작 시간 이후여야 합니다";
                  if (end.getMinutes() !== 0) return "정각 단위로 입력해주세요";
                  return true;
                },
              })}
              error={!!errors.auctionEndAt}
              helperText={errors.auctionEndAt?.message || "예: 연-월-일 12:00"}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              "상품 및 경매 수정하기"
            ) : (
              "상품 및 경매 등록하기"
            )}
          </Button>
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>알림</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} autoFocus>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductRegistration;
