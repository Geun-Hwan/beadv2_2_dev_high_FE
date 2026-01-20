import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProductImageUrls } from "@moreauction/utils";
import { ImageWithFallback } from "@/shared/components/common/ImageWithFallback";
import type { ChatMessage } from "@/features/chat/hooks/useChat";
import SmartToyIcon from "@mui/icons-material/SmartToy";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  onSend: (message: string) => void;
  onRetry: () => void;
  isSending: boolean;
  error: string | null;
  messages: ChatMessage[];
  hasFailedMessage: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  open,
  onClose,
  onClear,
  onSend,
  onRetry,
  isSending,
  error,
  messages,
  hasFailedMessage,
}) => {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: { xs: 0, sm: 88 },
        right: { xs: 0, sm: 24 },
        width: { xs: "100%", sm: 380 },
        height: { xs: "70vh", sm: 520 },
        zIndex: 1300,
        borderRadius: { xs: 0, sm: 3 },
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2 }}>
        <SmartToyIcon />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AI 상담
        </Typography>
        <IconButton size="small" onClick={onClear} aria-label="clear chat">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onClose} aria-label="close chat">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={1.5}>
          {messages.map((message) => {
            const fileGroupMap = new Map(
              (message.fileGroups ?? []).map((group) => [
                group.fileGroupId,
                group,
              ])
            );
            return (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Stack spacing={1} sx={{ maxWidth: "80%" }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: (theme) =>
                        message.role === "user"
                          ? theme.palette.primary.main
                          : theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.grey[100],
                      color: (theme) =>
                        message.role === "user"
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.primary,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Box>
                  {message.role === "assistant" &&
                    (message.contexts?.length ?? 0) > 0 && (
                      <Stack direction="row" spacing={1}>
                        {message.contexts?.map((context) => {
                          const resolvedFileGroup =
                            context.fileGroup ??
                            (context.fileGroupId
                              ? fileGroupMap.get(context.fileGroupId) ?? null
                              : null);
                          const imageUrl =
                            getProductImageUrls(resolvedFileGroup)[0];
                          return (
                            <Tooltip key={context.productId} title={context.name}>
                              <Box
                                component={Link}
                                to={`/products/${context.productId}`}
                                sx={{
                                  display: "inline-flex",
                                  textDecoration: "none",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <ImageWithFallback
                                  alt={context.name}
                                  src={imageUrl}
                                  width={60}
                                  height={60}
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 1,
                                    objectFit: "cover",
                                    bgcolor: "background.paper",
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Stack>
                    )}
                </Stack>
              </Box>
            );
          })}
          {isSending && (
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: "80%",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : theme.palette.grey[100],
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={14} color="inherit" />
                <Typography variant="body2">답변 생성중...</Typography>
              </Box>
            </Box>
          )}
          <div ref={endRef} />
        </Stack>
      </Box>

      {error && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Alert
            severity="error"
            action={
              hasFailedMessage ? (
                <IconButton
                  size="small"
                  aria-label="retry"
                  onClick={onRetry}
                  disabled={isSending}
                  color="inherit"
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              ) : null
            }
          >
            {error}
          </Alert>
        </Box>
      )}

      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim()) return;
          onSend(input);
          setInput("");
        }}
        sx={{ p: 2, pt: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            fullWidth
            disabled={isSending}
          />
          <IconButton
            type="submit"
            disabled={isSending || !input.trim()}
            color="primary"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {isSending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SendIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
};
