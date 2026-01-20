import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { ChatFab } from "@/features/chat/components/ChatFab";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { useChat } from "@/features/chat/hooks/useChat";

interface ChatWidgetProps {
  disabled?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ disabled = false }) => {
  const [open, setOpen] = useState(false);
  const {
    messages,
    isSending,
    error,
    sendMessage,
    reset,
    bootstrap,
    retryFailed,
    failedMessage,
  } = useChat();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!wasOpenRef.current && open && messages.length === 0) {
      void bootstrap();
    }
    wasOpenRef.current = open;
  }, [bootstrap, messages.length, open]);

  if (disabled) return null;

  return (
    <>
      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        onClear={reset}
        onSend={sendMessage}
        onRetry={retryFailed}
        isSending={isSending}
        error={error}
        messages={messages}
        hasFailedMessage={!!failedMessage}
      />
      {!open && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1200,
          }}
        >
          <ChatFab onClick={() => setOpen(true)} unreadCount={0} />
        </Box>
      )}
    </>
  );
};
