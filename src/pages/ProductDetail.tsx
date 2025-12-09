import React from 'react';
import { Typography, Container } from '@mui/material';

const ProductDetail: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>
        상품 상세
      </Typography>
      {/* TODO: 상품 상세 정보 및 연관 경매 내역을 표시하는 UI를 구현합니다. */}
    </Container>
  );
};

export default ProductDetail;
