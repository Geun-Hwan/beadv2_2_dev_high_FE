import { useCallback, useEffect, useMemo, useState } from "react";
import type { FileGroup, ProdcutSearchInfo } from "@moreauction/types";
import { productApi } from "@/apis/productApi";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  contexts?: ProdcutSearchInfo[];
  fileGroups?: FileGroup[];
}

const STORAGE_KEY = "moreauction.chat.messages";
const createMessage = (
  role: ChatRole,
  content: string,
  contexts?: ProdcutSearchInfo[],
  fileGroups?: FileGroup[]
): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  contexts,
  fileGroups,
});

const canUseStorage = () => typeof window !== "undefined";

const loadStoredMessages = (): ChatMessage[] | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item) => item && typeof item.content === "string");
  } catch {
    return null;
  }
};

const persistMessages = (messages: ChatMessage[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return loadStoredMessages() ?? [];
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: { allowEmpty?: boolean; silent?: boolean }
    ) => {
      const trimmed = content.trim();
      const allowEmpty = options?.allowEmpty ?? false;
      if ((!trimmed && !allowEmpty) || isSending) return;

      const shouldAppendUser = trimmed && !options?.silent;
      if (shouldAppendUser) {
        const userMessage = createMessage("user", trimmed);
        setMessages((prev) => [...prev, userMessage]);
      }
      setIsSending(true);
      setError(null);
      setFailedMessage(null);

      try {
        const response = await productApi.askChatbot(trimmed);
        const reply =
          response.data?.answer ??
          "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
        const contexts = response.data?.contexts ?? [];
        const fileGroups = response.data?.fileGroupResponse ?? [];
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", reply, contexts, fileGroups),
        ]);
      } catch (err) {
        setError("메시지 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        setFailedMessage(trimmed);
      } finally {
        setIsSending(false);
      }
    },
    [isSending]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setFailedMessage(null);
    persistMessages([]);
  }, []);

  const bootstrap = useCallback(async () => {
    if (isSending || messages.length > 0) return;
    await sendMessage("안녕", { silent: true });
  }, [isSending, messages.length, sendMessage]);

  const retryFailed = useCallback(async () => {
    if (!failedMessage || isSending) return;
    await sendMessage(failedMessage, { silent: true });
  }, [failedMessage, isSending, sendMessage]);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  return useMemo(
    () => ({
      messages,
      isSending,
      error,
      sendMessage,
      bootstrap,
      retryFailed,
      failedMessage,
      reset,
    }),
    [
      error,
      isSending,
      messages,
      reset,
      sendMessage,
      bootstrap,
      retryFailed,
      failedMessage,
    ]
  );
};
