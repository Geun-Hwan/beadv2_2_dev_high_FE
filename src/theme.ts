import { createTheme } from '@mui/material/styles';

/**
 * Material-UI 커스텀 테마
 * 여기에 프로젝트 전체에 적용할 색상, 타이포그래피 등을 정의할 수 있습니다.
 * @see https://mui.com/customization/theming/
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: '#red',
    },
  },
  // 추가적인 테마 커스터마이징은 여기에 작성합니다.
});

export default theme;
