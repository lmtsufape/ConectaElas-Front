import React, { useEffect } from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import { useChat } from "../Contexts/ChatContext";
import { useHistory } from "react-router-dom";

const AssistantChatList: React.FC = () => {
  const { chats, selectChat, generateRandomName, fetchChats } = useChat();
  const history = useHistory();

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chat</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonList>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <IonItem
              key={chat.id}
              button
              onClick={async () => {
                await selectChat(chat.id);
                history.push(`/assistantChats/${chat.id}`);
              }}
            >
              <IonLabel>
                <h2>{generateRandomName(chat.usuario.id)}</h2>
                <p>
                  {chat.mensagens.length > 0
                    ? chat.mensagens[chat.mensagens.length - 1].Mensagem
                    : "Sem mensagens"}
                </p>
              </IonLabel>
            </IonItem>
          ))
        ) : (
          <p>Nenhum chat ativo</p>
        )}
      </IonList>
    </>
  );
};

export default AssistantChatList;
