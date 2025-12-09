import axios from "axios";

// API 서버의 기본 URL을 설정합니다.
// 환경 변수를 통해 관리하는 것이 이상적이지만, 우선은 하드코딩합니다.
// 예: http://localhost:8080/api
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/**
 * 기본 axios 인스턴스입니다.
 * 모든 API 요청에 이 인스턴스를 사용합니다.
 *
 * @example
 * client.get('/users');
 */
export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 요청을 보내기 전에 수행할 작업을 정의합니다.
// 예를 들어, 모든 요청에 인증 토큰을 추가할 수 있습니다.
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 응답을 받은 후 수행할 작업을 정의합니다.
// 예를 들어, 특정 에러 코드에 대한 전역 처리를 할 수 있습니다.
client.interceptors.response.use(
  (response) => {
    // 응답 데이터가 있는 경우 그대로 반환합니다.
    return response;
  },
  async (error) => {
    // HTTP 상태 코드가 2xx 범위를 벗어나는 경우 이곳에서 처리됩니다.
    // 예: 401 Unauthorized 에러 발생 시 로그인 페이지로 리디렉션
    // if (error.response && error.response.status === 401) {
    //   window.location.href = '/login';
    // }
    const originalRequest = error.config;

    // 401 에러 && 아직 재시도 안함
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 루프 방지
      const newToken = await refreshToken();

      if (newToken) {
        // 새 토큰으로 요청 재시도
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return client(originalRequest);
      } else {
        // 재발급 실패 → 로그아웃 처리
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// 토큰 재발급 함수 예시
async function refreshToken() {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
      {
        // 필요 시 refresh token 전달
      }
    );
    const newAccessToken = response.data.accessToken;
    localStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (err) {
    console.error("토큰 재발급 실패:", err);
    return null; // 재발급 실패
  }
}
