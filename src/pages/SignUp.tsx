import { Button, Grid, Link as MuiLink, TextField } from "@mui/material";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { userApi, type SignupParams } from "../apis/userApi";
import FormContainer from "../components/FormContainer";

// 회원가입 폼에 필요한 모든 필드 타입을 정의
interface SignUpFormValues extends SignupParams {
  passwordConfirm: string;
}

const SignUp: React.FC = () => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    // SignUpFormValues 타입 적용
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      name: "",
      nickname: "",
      phone_number: "",
      zip_code: "",
      state: "",
      city: "",
      detail: "",
    },
  });
  const navigate = useNavigate();
  const password = watch("password");

  const onSubmit = async (data: SignUpFormValues) => {
    // data 타입 변경
    try {
      // API 호출 시 passwordConfirm 필드는 제외합니다.
      const { ...apiData } = data; // passwordConfirm을 구조분해하여 제외

      await userApi.signup(apiData);
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (error) {
      console.error("회원가입 실패:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <FormContainer
      title="회원가입"
      onSubmit={handleSubmit(onSubmit)}
      maxWidth="sm"
    >
      <Grid container spacing={2}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: "이메일은 필수 항목입니다.",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "유효한 이메일 주소를 입력해주세요.",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              required
              fullWidth
              label="이메일 주소"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
        <Grid flexGrow={1}>
          <Controller
            name="password"
            control={control}
            rules={{
              required: "비밀번호는 필수 항목입니다.",
              minLength: {
                value: 8,
                message: "비밀번호는 8자 이상이어야 합니다.",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="비밀번호"
                type="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="passwordConfirm"
            control={control}
            rules={{
              required: "비밀번호 확인은 필수 항목입니다.",
              validate: (value) =>
                value === password || "비밀번호가 일치하지 않습니다.",
            }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="비밀번호 확인"
                type="password"
                error={!!errors.passwordConfirm}
                helperText={errors.passwordConfirm?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="name"
            control={control}
            rules={{ required: "이름은 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="이름"
                autoComplete="name"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="nickname"
            control={control}
            rules={{ required: "닉네임은 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="닉네임"
                autoComplete="nickname"
                error={!!errors.nickname}
                helperText={errors.nickname?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="phone_number"
            control={control}
            rules={{ required: "연락처는 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="연락처"
                autoComplete="tel"
                error={!!errors.phone_number}
                helperText={errors.phone_number?.message}
              />
            )}
          />
        </Grid>
        <Grid>
          <Controller
            name="zip_code"
            control={control}
            rules={{ required: "우편번호는 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="우편번호"
                autoComplete="postal-code"
                error={!!errors.zip_code}
                helperText={errors.zip_code?.message}
              />
            )}
          />
        </Grid>
        <Grid>
          <Button type="submit" fullWidth variant="outlined">
            검색
          </Button>
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="state"
            control={control}
            rules={{ required: "시/도는 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="시/도"
                autoComplete="address-level1"
                error={!!errors.state}
                helperText={errors.state?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="city"
            control={control}
            rules={{ required: "시/군/구는 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="시/군/구"
                autoComplete="address-level2"
                error={!!errors.city}
                helperText={errors.city?.message}
              />
            )}
          />
        </Grid>
        <Grid flexGrow={1}>
          <Controller
            name="detail"
            control={control}
            rules={{ required: "상세주소는 필수 항목입니다." }}
            render={({ field }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="상세주소"
                autoComplete="street-address"
                error={!!errors.detail}
                helperText={errors.detail?.message}
              />
            )}
          />
        </Grid>
      </Grid>
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        회원가입
      </Button>
      <Grid container justifyContent="flex-end">
        <Grid component="div">
          <MuiLink component={RouterLink} to="/login" variant="body2">
            이미 계정이 있으신가요? 로그인
          </MuiLink>
        </Grid>
      </Grid>
    </FormContainer>
  );
};

export default SignUp;
