import type { Product } from "@moreauction/types";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { ImageWithFallback } from "@/shared/components/common/ImageWithFallback";

type WishlistItemRowProps = {
  product: Product;
  imageUrl?: string;
  isImageLoading: boolean;
  isRemoving: boolean;
  onRemove: () => void;
};

const WishlistItemRow: React.FC<WishlistItemRowProps> = ({
  product,
  imageUrl,
  isImageLoading,
  isRemoving,
  onRemove,
}) => {
  const categoryLabels = (() => {
    if (!product.categories?.length) return [];
    return product.categories
      .map((category) =>
        typeof category === "string" ? category : category.name
      )
      .filter((label): label is string => !!label);
  })();
  const primaryCategories = categoryLabels.slice(0, 2);
  const remainingCategoryCount = Math.max(
    categoryLabels.length - primaryCategories.length,
    0
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        display: "flex",
        gap: 1.5,
        alignItems: "stretch",
        position: "relative",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          flexShrink: 0,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "grey.100",
        }}
      >
        <ImageWithFallback
          src={imageUrl}
          alt={product.name}
          height={88}
          loading={isImageLoading}
          sx={{ objectFit: "cover" }}
        />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          {primaryCategories.length > 0 ? (
            <>
              <Chip
                label={primaryCategories[0]}
                size="small"
                variant="outlined"
              />
              {primaryCategories.length > 1 && (
                <Chip
                  label={primaryCategories[1]}
                  size="small"
                  variant="outlined"
                />
              )}
              {remainingCategoryCount > 0 && (
                <Chip
                  label={`+${remainingCategoryCount}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              카테고리 없음
            </Typography>
          )}
        </Stack>
        <Typography
          fontWeight={700}
          component={RouterLink}
          to={`/products/${product.id}`}
          sx={{
            textDecoration: "none",
            color: "inherit",
            "&:hover": { textDecoration: "underline" },
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </Typography>
        {product.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          pl: 0.5,
        }}
      >
        <Tooltip title="찜 해제">
          <span>
            <IconButton
              aria-label="remove"
              onClick={onRemove}
              disabled={isRemoving}
              size="small"
              sx={{
                bgcolor: "action.selected",
                color: "text.primary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {isRemoving && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            zIndex: 1,
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="caption" color="text.secondary">
            찜 해제 중...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default WishlistItemRow;
