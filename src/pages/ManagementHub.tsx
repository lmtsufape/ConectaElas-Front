import React from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { 
  schoolOutline, 
  albumsOutline,
  gridOutline,
  chevronForwardOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './ManagementHub.css';

const ManagementHub: React.FC = () => {
  const history = useHistory();

  const managementOptions = [
    {
      title: 'Gerenciamento de Quiz',
      icon: schoolOutline,
      route: '/tabs/quiz-management',
      description: 'Criar, editar e remover quizzes'
    },
    {
      title: 'Gerenciamento de Cartas',
      icon: albumsOutline,
      route: '/tabs/card-management',
      description: 'Gerenciar cartas e temas'
    },
    {
      title: 'Gerenciamento de Caça-Palavras',
      icon: gridOutline,
      route: '/tabs/caca-palavras-management',
      description: 'Gerenciar jogos de caça-palavras'
    }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/tab3" />
          </IonButtons>
          <IonTitle className="title-centered">Gerenciamento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="management-content">
        <div className="management-container">
          {/*<h2 className="section-title">Selecione uma opção</h2>*/}
          
          <IonGrid>
            <IonRow>
              {managementOptions.map((option, index) => (
                <IonCol size="12" sizeMd="6" key={index}>
                  <IonCard 
                    button 
                    onClick={() => history.push(option.route)}
                    className="management-card"
                  >
                    <IonCardContent className="management-card-content">
                      <div className="icon-container">
                        <IonIcon icon={option.icon} />
                      </div>
                      <div className="text-container">
                        <IonCardTitle>{option.title}</IonCardTitle>
                        <p>{option.description}</p>
                      </div>
                      <IonIcon icon={chevronForwardOutline} className="arrow-icon" />
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ManagementHub;
