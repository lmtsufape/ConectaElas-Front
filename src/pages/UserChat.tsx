import React, { useState, useEffect, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonInput,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import { useChat } from "../Contexts/ChatContext";
import { useAuth } from "../Contexts/AuthContext";
import "./UserChat.css";
import { IonIcon } from "@ionic/react";
import { send } from "ionicons/icons";

const UserChat: React.FC = () => {
  const { activeChat, startChat, sendMessage, selectChat, fetchMessages } =
    useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<[]>([]);

  // Quando a tela for carregada, rola até o final para mostrar as mensagens mais recentes
  useEffect(() => {
    if (!activeChat) {
      startChat(""); // Inicia o chat se não houver um chat ativo
    } else {
      selectChat(activeChat.id); // Seleciona o chat ativo se já existir
    }
  }, []);

  // Busca as mensagens do chat ativo sempre que ele mudar
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessageActiveChat = async () => {
      const messages = await fetchMessages(activeChat.id);
      setMessages(messages);
    };

    fetchMessageActiveChat();
  }, [activeChat]);

  // Rola até o final sempre que as mensagens mudam
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Quando as mensagens mudarem, rola até o final

  const handleSendMessage = async () => {
    if (!message.trim()) return; // Não envia mensagens vazias

    if (!activeChat) {
      await startChat(message); // Inicia o chat caso não haja chat ativo
    } else {
      await sendMessage(activeChat.id, message); // Envia a mensagem para o chat ativo
    }
    setMessage(""); // Limpa o campo de mensagem após o envio
  };

  return (
    <IonPage className="Chat-root">
      <IonHeader className="Chat-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/tab1" />
          </IonButtons>
          <IonTitle className="center-title">Chat com Assistente</IonTitle>
          <IonButtons slot="end">
            <div style={{ width: "44px" }} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <div className="messages-container">
          {messages.length ? (
            messages
              .sort(
                (a: any, b: any) =>
                  new Date(a.Data_Envio).getTime() -
                  new Date(b.Data_Envio).getTime()
              )
              .map((msg: any) => (
                <div
                  key={msg.id}
                  className={`message-bubble ${
                    user?.id === msg.remetente.id ? "sent" : "received"
                  }`}
                >
                  <p>{msg.Mensagem}</p>
                  <span className="timestamp">
                    {new Date(msg.Data_Envio).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    às{" "}
                    {new Date(msg.Data_Envio).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
          ) : (
            <p className="no-messages">
              Envie uma mensagem para iniciar seu chat com um dos nossos
              assistentes!
            </p>
          )}
          <div ref={chatEndRef} />
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar className="chat-input-toolbar">
          <div style={{ display: "flex", alignItems: "center" }}>
            <IonInput
              value={message}
              placeholder="Digite sua mensagem..."
              onIonChange={(e) => setMessage(e.detail.value!)}
              style={{ flex: 1 }}
            />
            <IonIcon
              icon={send}
              size="large"
              style={{ cursor: "pointer", color: "white", marginLeft: "8px" }}
              onClick={handleSendMessage}
            />
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default UserChat;
