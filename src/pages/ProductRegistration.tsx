import {
  Alert,
  Box,
  Button,
  ButtonBase,
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
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  addHours,
  format,
  setMilliseconds,
  setMinutes,
  setSeconds,
} from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { auctionApi } from "../apis/auctionApi";
import { categoryApi } from "../apis/categoryApi";
import { fileApi } from "../apis/fileApi";
import { productApi } from "../apis/productApi";
import { useAuth } from "../contexts/AuthContext";
import type { Auction, AuctionUpdateRequest } from "../types/auction";
import { AuctionStatus } from "../types/auction";
import type {
  Product,
  ProductCategory,
  ProductCreationRequest,
  ProductUpdateRequest,
} from "../types/product";
import { ProductStatus } from "../types/product";

import { ko } from "date-fns/locale";
import { UserRole } from "../types/user";
import { getProductImageUrls } from "../utils/images";

interface ProductAuctionFormData {
  name: string;
  description: string;
  categoryIds: string[];
  auctionStartAt: string;
  auctionEndAt: string;
  startBid: number;
  fileGroupId?: string;
}

interface LocalImage {
  id: string;
  file: File;
  preview: string;
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
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [useExistingImages, setUseExistingImages] = useState(false);
  const [existingPreviewIndex, setExistingPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [productDeleteLoading, setProductDeleteLoading] = useState(false);
  const [auctionDeleteLoading, setAuctionDeleteLoading] = useState(false);
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  const deletableAuctionStatuses: AuctionStatus[] = [
    AuctionStatus.READY,
    AuctionStatus.FAILED,
    AuctionStatus.CANCELLED,
  ];
  const deletableProductStatuses: ProductStatus[] = [
    ProductStatus.READY,
    ProductStatus.FAILED,
    ProductStatus.CANCELLED,
  ];

  const localImagesRef = useRef<LocalImage[]>([]);

  useEffect(() => {
    localImagesRef.current = localImages;
  }, [localImages]);

  useEffect(() => {
    return () => {
      localImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.preview)
      );
    };
  }, []);

  const clearLocalImages = () => {
    setLocalImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.preview));
      return [];
    });
  };

  const handleRemoveLocalImage = (id: string) => {
    setLocalImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const buildLocalImage = (file: File): LocalImage => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    file,
    preview: URL.createObjectURL(file),
  });

  const handleExistingImageModeChange = (next: boolean) => {
    setUseExistingImages(next);
    setExistingPreviewIndex(0);
    if (next) {
      clearLocalImages();
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryApi.getCategories();
        setAllCategories(response.data);
      } catch (err) {
        console.error("카테고리 목록 로딩 실패:", err);
        setError("카테고리 목록을 불러오는 데 실패했습니다.");
      } finally {
        setCategoriesLoading(false);
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
        setHasActiveAuction(false);
        setUseExistingImages(false);
        setExistingPreviewIndex(0);
        clearLocalImages();
        return;
      }

      setLoading(true);
      try {
        let productData: Product | null = null;
        let auctionData: Auction | null = null;

        // 상품 ID로 조회
        if (productId) {
          const productResponse = await productApi.getProductById(productId);
          productData = productResponse.data.product;
          const auctions = productResponse.data.auctions || [];
          // 상품의 경매 목록 조회

          // 수정 가능한 경매 찾기 (READY 상태)
          auctionData =
            auctions.find(
              (auction: Auction) => auction.status === AuctionStatus.READY
            ) || null;

          const blockingAuctionExists = auctions.some(
            (auction: Auction) => auction.status === AuctionStatus.READY
          );
          setHasActiveAuction(blockingAuctionExists);
        }

        // 권한 체크
        if (user?.userId !== productData?.sellerId) {
          if (user?.role !== "ADMIN") {
            alert("수정할 권한이 없습니다.");
            navigate(-1);

            return;
          }
        }

        // 경매 상태 체크 (수정 모드에서만)
        if (auctionData && auctionData.status !== AuctionStatus.READY) {
          alert("대기 중인 경매만 수정할 수 있습니다.");
          navigate(-1);
          return;
        }
        console.log(productData, auctionData);
        // 폼 데이터 설정
        reset({
          name: productData?.name,
          description: productData?.description,
          startBid: auctionData?.startBid,
          categoryIds: (productData?.categories ?? [])?.map((c) =>
            typeof c === "string" ? c : String(c.id)
          ),
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
        const selectedCategoryIds: string[] = (
          productData?.categories ?? []
        )?.map((c) => (typeof c === "string" ? c : String(c.id) ?? []));
        setSelectedCategoryIds(selectedCategoryIds);
        setCurrentProduct(productData);
        setCurrentAuction(auctionData);
        const hasExistingImages =
          (productData?.fileGroup?.files?.length ?? 0) > 0 ||
          (productData?.images?.length ?? 0) > 0 ||
          !!productData?.imageUrl;
        setUseExistingImages(hasExistingImages);
        setExistingPreviewIndex(0);
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
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    if (!files.length) return;
    setLocalImages((prev) => [
      ...prev,
      ...files.map((file) => buildLocalImage(file)),
    ]);
    setUseExistingImages(false);
    event.target.value = "";
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
    if (loading) return;

    setLoading(true);
    setError(null);
    const localFiles = localImages.map((image) => image.file);
    const fileGrpId = currentProduct?.fileGroup?.fileGroupId;
    const canReuseExistingImages =
      isEditMode &&
      useExistingImages &&
      (fileGrpId ?? null) &&
      localFiles.length === 0;
    let finalFileGroupId: number | string | undefined = canReuseExistingImages
      ? fileGrpId ?? undefined
      : undefined;

    try {
      if (!canReuseExistingImages && localFiles.length > 0) {
        const fileUploadResponse = await fileApi.uploadFiles(localFiles);
        finalFileGroupId = fileUploadResponse.data.fileGroupId;

        if (!finalFileGroupId) {
          throw new Error("파일 그룹 ID를 받아오지 못했습니다.");
        }
      }

      const auctionStart = format(data.auctionStartAt, "yyyy-MM-dd HH:mm:00", {
        locale: ko,
      });
      const auctionEnd = format(data.auctionEndAt, "yyyy-MM-dd HH:mm:00", {
        locale: ko,
      });

      if (isEditMode && productId) {
        // 수정 모드
        // 상품 ID로 수정 - 상품과 경매 모두 수정 또는 재등록
        const auctionsResponse = await auctionApi.getAuctionsByProductId(
          productId
        );
        const auctions = Array.isArray(auctionsResponse.data.content)
          ? auctionsResponse.data.content
          : auctionsResponse.data;

        const readyAuction = auctions.find(
          (auction: Auction) => auction.status === AuctionStatus.READY
        );

        const hasActiveAuctionInList = auctions.some(
          (auction: Auction) =>
            auction.status === AuctionStatus.IN_PROGRESS ||
            auction.status === AuctionStatus.READY
        );

        // 진행 중인데 대기 경매가 없는 경우 수정 불가
        if (!readyAuction && hasActiveAuctionInList) {
          alert("진행 중인 경매가 있어 상품/경매를 수정할 수 없습니다.");
          navigate(`/products/${productId}`);
          return;
        }

        const productData: ProductUpdateRequest & AuctionUpdateRequest = {
          name: data.name,
          description: data.description,
          fileGrpId: finalFileGroupId ?? undefined,
          categoryIds: selectedCategoryIds,
          startBid: Number(data.startBid),
          auctionStartAt: auctionStart,
          auctionEndAt: auctionEnd,
        };
        const productResponse = await productApi.updateProduct(
          productId,
          productData
        );

        const createdProduct = productResponse.data.product;
        alert("상품과 경매가 성공적으로 수정되었습니다.");
        navigate(`/products/${createdProduct?.id}`);
      } else {
        // 신규 등록 - 상품과 경매 함께 생성
        const productData: ProductCreationRequest & AuctionUpdateRequest = {
          name: data.name,
          description: data.description,
          fileGrpId: finalFileGroupId ?? undefined,
          categoryIds: selectedCategoryIds,
          startBid: Number(data.startBid),
          auctionStartAt: auctionStart,
          auctionEndAt: auctionEnd,
        };

        const productResponse = await productApi.createProduct(productData);
        const createdProduct = productResponse.data.product;

        console.log(createdProduct, "<<<<<");

        // 상품 생성 후 경매 생성

        alert("상품과 경매가 성공적으로 등록되었습니다.");
        navigate(`/products/${createdProduct?.id}`);
      }
    } catch (err: any) {
      console.error("처리 실패:", err);
      setError(err.response?.data?.message || "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!currentProduct?.id) {
      alert("상품 정보를 찾을 수 없습니다.");
      return;
    }
    if (hasActiveAuction) {
      alert("대기 중인 경매를 먼저 삭제한 뒤 상품을 삭제할 수 있습니다.");
      return;
    }
    const sellerIdForDeletion = currentProduct.sellerId ?? user?.userId;
    if (!sellerIdForDeletion) {
      alert("상품 삭제 권한이 없습니다.");
      return;
    }
    if (
      !window.confirm(
        "상품을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
      )
    ) {
      return;
    }
    try {
      setProductDeleteLoading(true);
      await productApi.deleteProduct(currentProduct.id, sellerIdForDeletion);
      alert("상품이 삭제되었습니다.");
      navigate("/products");
    } catch (err: any) {
      console.error("상품 삭제 실패:", err);
      alert(err?.response?.data?.message ?? "상품 삭제에 실패했습니다.");
    } finally {
      setProductDeleteLoading(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (
      !currentAuction?.auctionId ||
      !deletableAuctionStatuses.includes(currentAuction.status)
    ) {
      alert("삭제할 수 있는 경매 정보를 찾을 수 없습니다.");
      return;
    }
    if (
      !window.confirm(
        "경매를 삭제하시겠습니까? 삭제된 경매는 복구되지 않습니다."
      )
    ) {
      return;
    }
    try {
      setAuctionDeleteLoading(true);
      await auctionApi.removeAuction(currentAuction.auctionId);
      alert("경매가 삭제되었습니다.");
      setCurrentAuction(null);
      setHasActiveAuction(false);
    } catch (err: any) {
      console.error("경매 삭제 실패:", err);
      alert(err?.response?.data?.message ?? "경매 삭제에 실패했습니다.");
    } finally {
      setAuctionDeleteLoading(false);
    }
  };

  if (user?.role !== "SELLER" && user?.role !== "ADMIN" && !isEditMode) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ my: 4 }}>
          상품 및 경매 등록
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          상품과 경매를 등록할 권한이 없습니다. 판매자 또는 관리자만 등록할 수
          있습니다.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/seller/register"
        >
          판매자 등록하러 가기
        </Button>
      </Container>
    );
  }

  const canDeleteProduct = !!(
    isEditMode &&
    currentProduct &&
    (user?.role === UserRole.ADMIN ||
      user?.userId === currentProduct.sellerId) &&
    deletableProductStatuses.includes(currentProduct.status) &&
    !hasActiveAuction
  );

  const canDeleteAuction = !!(
    currentProduct &&
    currentAuction &&
    (user?.role === UserRole.ADMIN ||
      user?.userId === currentProduct.sellerId) &&
    deletableAuctionStatuses.includes(currentAuction.status)
  );

  const existingImageUrls = useMemo(
    () => getProductImageUrls(currentProduct),
    [currentProduct]
  );
  const showExistingImages = isEditMode && existingImageUrls.length > 0;
  const existingPreviewUrl =
    existingImageUrls[existingPreviewIndex] ?? existingImageUrls[0] ?? null;

  useEffect(() => {
    setExistingPreviewIndex(0);
  }, [currentProduct?.id, existingImageUrls.length]);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Typography variant="h4">
            {isEditMode ? "상품 및 경매 수정" : "상품 및 경매 등록"}
          </Typography>
          {isEditMode && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "flex-start", md: "flex-end" },
                gap: 1,
                maxWidth: { xs: "100%", md: "auto" },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {canDeleteAuction && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteAuction}
                    disabled={auctionDeleteLoading}
                  >
                    {auctionDeleteLoading ? "경매 삭제 중..." : "경매 삭제"}
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteProduct}
                  disabled={productDeleteLoading || !canDeleteProduct}
                >
                  {productDeleteLoading
                    ? "상품 삭제 중..."
                    : hasActiveAuction
                    ? "상품 삭제 (대기 경매 존재)"
                    : "상품 삭제"}
                </Button>
              </Stack>
              {hasActiveAuction && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  sx={{ textAlign: { xs: "left", md: "right" } }}
                >
                  대기 중인 경매를 먼저 삭제해야 상품을 삭제할 수 있습니다.
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Box>
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
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
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
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
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
              {categoriesLoading && allCategories.length === 0
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={<Checkbox disabled />}
                      label={<Skeleton width={80} />}
                    />
                  ))
                : allCategories?.map((category) => (
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

            {showExistingImages && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "grey.50",
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    현재 등록된 이미지
                  </Typography>
                  {existingPreviewUrl && (
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={existingPreviewUrl}
                        alt="대표 이미지"
                        sx={{
                          width: "100%",
                          maxHeight: 240,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Box>
                  )}
                  {existingImageUrls.length > 1 && (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ pt: 1 }}
                    >
                      {existingImageUrls.map((url, idx) => (
                        <ButtonBase
                          key={`${url}-${idx}`}
                          onClick={() => setExistingPreviewIndex(idx)}
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "2px solid",
                            borderColor:
                              idx === existingPreviewIndex
                                ? "primary.main"
                                : "transparent",
                            boxShadow: idx === existingPreviewIndex ? 2 : 0,
                          }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt={`추가 이미지 ${idx + 1}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </ButtonBase>
                      ))}
                    </Stack>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      handleExistingImageModeChange(!useExistingImages)
                    }
                  >
                    {useExistingImages
                      ? "이미지 교체하기"
                      : "기존 이미지 유지하기"}
                  </Button>
                  {!useExistingImages && (
                    <Typography variant="caption" color="text.secondary">
                      새로운 이미지를 업로드하면 기존 이미지가 대체됩니다.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}

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
                <Typography variant="body1">
                  {localImages.length > 0
                    ? "이미지를 추가로 선택"
                    : "이미지 업로드"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  클릭하여 상품 이미지를 여러 장 선택하세요
                </Typography>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>

              {localImages.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: "text.secondary",
                      fontWeight: "bold",
                    }}
                  >
                    선택한 이미지 ({localImages.length}) — 첫 번째 이미지는
                    대표로 사용됩니다.
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={localImages[0].preview}
                        alt="선택한 대표 이미지"
                        sx={{
                          width: "100%",
                          maxHeight: 240,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() =>
                          handleRemoveLocalImage(localImages[0].id)
                        }
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          minWidth: 0,
                          px: 1,
                        }}
                      >
                        제거
                      </Button>
                    </Box>
                    {localImages.length > 1 && (
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {localImages.slice(1).map((image) => (
                          <Box
                            key={image.id}
                            sx={{
                              width: 96,
                              borderRadius: 1,
                              border: "1px solid #e0e0e0",
                              overflow: "hidden",
                              backgroundColor: "background.paper",
                            }}
                          >
                            <Box
                              component="img"
                              src={image.preview}
                              alt="선택한 상품 이미지 미리보기"
                              sx={{
                                width: "100%",
                                height: 96,
                                objectFit: "cover",
                              }}
                            />
                            <Button
                              size="small"
                              color="error"
                              fullWidth
                              onClick={() => handleRemoveLocalImage(image.id)}
                            >
                              제거
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                  {localImages.length > 1 && (
                    <Button
                      size="small"
                      color="inherit"
                      sx={{ mt: 1 }}
                      onClick={clearLocalImages}
                    >
                      선택한 이미지 모두 제거
                    </Button>
                  )}
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
                inputLabel: {
                  shrink: true,
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
