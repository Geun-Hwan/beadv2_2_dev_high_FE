import { Box, Container, Typography } from "@mui/material";
import React from "react";
import AddressManager from "@/features/profile/components/AddressManager";

const ProfileAddresses: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          주소지 관리
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          배송지 정보를 등록하고 기본 주소지를 설정하세요.
        </Typography>
        <AddressManager />
      </Box>
    </Container>
  );
};

export default ProfileAddresses;
