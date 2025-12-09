import { useEffect, useRef, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface UseStompProps {
  topic: string;
  onMessage: (message: IMessage) => void;
  auctionId: string;
}

/**
 * STOMP over SockJS 웹소켓 연결을 위한 React Hook
 * @param topic - 구독할 토픽
 * @param onMessage - 메시지 수신 시 호출될 콜백 함수
 */
export const useStomp = ({ topic, onMessage, auctionId }: UseStompProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  // 한 번만 실행되도록 useEffect
  useEffect(() => {
    if (clientRef.current) return; // 이미 클라이언트 생성되면 재생성 방지

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8000/ws-auction"),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: console.log,
      onConnect: () => {
        setIsConnected(true);
        subscriptionRef.current = client.subscribe(
          `/topic/${topic}.${auctionId}`,
          (msg) => onMessage(msg)
        );

        client.publish({
          destination: `/auctions/join/${auctionId}`,
          body: JSON.stringify({}),
        });
      },
      onStompError: (frame) => {
        console.error("STOMP: 브로커 오류", frame.headers["message"]);
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log("STOMP: 연결 해제");
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
      clientRef.current = null;
    };
  }, []); // 빈 dependency → 한 번만 실행

  const sendMessage = (
    destination: string,
    body: string,
    headers?: Record<string, string>
  ) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body, headers });
      console.log(`STOMP: 메시지 전송 (목적지: ${destination})`, body);
    } else {
      console.error("STOMP: 클라이언트가 연결되지 않았습니다.");
    }
  };

  return { isConnected, sendMessage };
};
