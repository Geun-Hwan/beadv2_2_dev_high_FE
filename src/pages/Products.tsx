import React from "react";
import { Typography, Container } from "@mui/material";

const Products: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>
        상품 목록
      </Typography>
      {/* TODO: 상품 목록을 표시하는 UI를 구현합니다. */}
    </Container>
  );
};

export default Products;
