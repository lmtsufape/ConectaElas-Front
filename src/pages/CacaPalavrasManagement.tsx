import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast,
  IonAlert,
  IonSpinner
} from '@ionic/react';
import {
  add,
  trash,
  create,
  closeOutline,
  checkmark,
  addCircle,
  play
} from 'ionicons/icons';
import {
  getAllCacaPalavras,
  createCacaPalavras,
  updateCacaPalavras,
  deleteCacaPalavras,
  CacaPalavrasItem
} from '../Services/CacaPalavrasService';
import './CardManagement.css'; // Reusing styles
import './CacaPalavrasManagement.css'; // Specific styles

const CacaPalavrasManagement: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<CacaPalavrasItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<CacaPalavrasItem | null>(null);

  // Form State
  const [titulo, setTitulo] = useState<string>('');
  const [palavras, setPalavras] = useState<string[]>([]);
  const [newWord, setNewWord] = useState<string>('');

  // Toast & Alert
  const [toast, setToast] = useState<{show: boolean, msg: string, color: string}>({show: false, msg: '', color: 'success'});
  const [deleteAlert, setDeleteAlert] = useState<{show: boolean, id: string | number | null}>({show: false, id: null});

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const handler = (ev: any) => {
      ev.detail.register(10, () => {
        history.replace("/tabs/games");
      });
    };
    document.addEventListener("ionBackButton", handler as any);
    return () => document.removeEventListener("ionBackButton", handler as any);
  }, [history]);

  const loadItems = async () => {
    setLoading(true);
    const res = await getAllCacaPalavras();
    if (res && res.data) {
      setItems(res.data);
    }
    setLoading(false);
  };

  const handleOpenCreateModal = () => {
    setTitulo('');
    setPalavras([]);
    setNewWord('');
    setIsUpdating(false);
    setItemToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: CacaPalavrasItem) => {
    setTitulo(item.titulo);
    setPalavras([...(item.palavras || [])]);
    setNewWord('');
    setItemToEdit(item);
    setIsUpdating(true);
    setShowModal(true);
  };

  const handleAddWord = () => {
    if (newWord.trim()) {
      setPalavras([...palavras, newWord.trim().toUpperCase()]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (index: number) => {
    const newPalavras = [...palavras];
    newPalavras.splice(index, 1);
    setPalavras(newPalavras);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      setToast({ show: true, msg: 'O título é obrigatório', color: 'warning' });
      return;
    }
    if (palavras.length === 0) {
      setToast({ show: true, msg: 'Adicione pelo menos uma palavra', color: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isUpdating && itemToEdit) {
        await updateCacaPalavras(itemToEdit.documentId || itemToEdit.id, titulo, palavras);
        setToast({ show: true, msg: 'Atualizado com sucesso!', color: 'success' });
      } else {
        await createCacaPalavras(titulo, palavras);
        setToast({ show: true, msg: 'Criado com sucesso!', color: 'success' });
      }
      setShowModal(false);
      loadItems();
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: 'Erro ao salvar.', color: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteAlert.id) {
      try {
        await deleteCacaPalavras(deleteAlert.id);
        setToast({ show: true, msg: 'Excluído com sucesso!', color: 'success' });
        loadItems();
      } catch (error) {
        console.error(error);
        setToast({ show: true, msg: 'Erro ao excluir.', color: 'danger' });
      }
      setDeleteAlert({ show: false, id: null });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/games" />
          </IonButtons>
          <IonTitle className="title-centered">Gerenciamento de Caça-Palavras</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="management-content">
        <div className="management-container cacapalavras-container">
          <IonButton expand="block" onClick={handleOpenCreateModal} className="ion-margin-bottom">
            <IonIcon slot="start" icon={add} />
            Criar Novo Jogo
          </IonButton>

          {loading ? (
             <div className="cacapalavras-loading">
               <IonSpinner name="crescent" />
             </div>
          ) : items.length === 0 ? (
             <div className="cacapalavras-empty">
               <p>Nenhum jogo encontrado.</p>
             </div>
          ) : (
            <IonList className="cacapalavras-list">
              {items.map(item => (
                <IonCard key={item.id} className="management-card cacapalavras-game-card">
                  <IonCardHeader>
                    <IonCardTitle>{item.titulo}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="management-info cacapalavras-card-info">{item.palavras?.length || 0} palavras</p>
                    <div className="cacapalavras-card-buttons">
                      <IonButton
                        fill="solid"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          history.push(`/tabs/games/caca-palavras/${item.documentId || item.id}?from=management`);
                        }}
                        className="cacapalavras-play-button"
                      >
                        <IonIcon slot="start" icon={play} />
                        Jogar
                      </IonButton>
                      <IonButton
                        fill="solid"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(item);
                        }}
                        className="cacapalavras-edit-button"
                      >
                        <IonIcon slot="start" icon={create} />
                        Editar
                      </IonButton>
                      <IonButton
                        fill="solid"
                        color="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteAlert({show: true, id: item.documentId || item.id});
                        }}
                        className="cacapalavras-delete-button"
                      >
                        <IonIcon slot="start" icon={trash} />
                        Excluir
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          )}
        </div>

        {/* Create/Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => !isSubmitting && setShowModal(false)} className="cacapalavras-confirm-modal">
          <IonHeader>
            <IonToolbar className="header-gradient">
              <IonTitle className="title-centered">{isUpdating ? 'Editar Jogo' : 'Novo Jogo'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
             <div className="quiz-result-container cacapalavras-form-container">
               <IonItem className="ion-margin-bottom">
                 <IonLabel position="stacked">Título</IonLabel>
                 <IonInput
                   value={titulo}
                   onIonChange={e => setTitulo(e.detail.value!)}
                   placeholder="Ex: Frutas, Países..."
                   className="custom-input"
                   disabled={isSubmitting}
                 />
               </IonItem>

               <div className="ion-margin-bottom">
                 <IonLabel position="stacked" className="cacapalavras-add-label">Adicionar Palavra</IonLabel>
                 <div className="cacapalavras-input-container">
                   <IonInput
                     value={newWord}
                     onIonChange={e => setNewWord(e.detail.value!)}
                     placeholder="Digite uma palavra..."
                     className="custom-input cacapalavras-word-input"
                     onKeyDown={e => {
                       if (e.key === 'Enter') handleAddWord();
                     }}
                     disabled={isSubmitting}
                   />
                   <IonButton 
                       onClick={handleAddWord} 
                       disabled={!newWord.trim() || isSubmitting}
                       className="cacapalavras-add-button"
                     >
                     <IonIcon icon={addCircle} className="cacapalavras-add-icon" />
                   </IonButton>
                 </div>
               </div>

               <IonList className="cacapalavras-words-list">
                 {palavras.map((palavra, index) => (
                   <IonItem key={index} lines="full" className="cacapalavras-word-item">
                     <IonLabel>{palavra}</IonLabel>
                     <IonButton fill="clear" color="danger" slot="end" onClick={() => handleRemoveWord(index)} disabled={isSubmitting} className="cacapalavras-remove-button">
                       <IonIcon icon={trash} />
                     </IonButton>
                   </IonItem>
                 ))}
               </IonList>

               <div className="navigation-buttons cacapalavras-action-buttons">
                 <IonButton
                   className="action-button cacapalavras-save-button"
                   expand="block"
                   onClick={handleSave}
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? <IonSpinner name="crescent" /> : (
                     <>
                       <IonIcon icon={checkmark} slot="start" />
                       {isUpdating ? 'Atualizar' : 'Salvar'}
                     </>
                   )}
                 </IonButton>
               </div>
             </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={toast.show}
          message={toast.msg}
          color={toast.color}
          duration={2000}
          onDidDismiss={() => setToast({...toast, show: false})}
          className="cacapalavras-toast"
        />

        <IonAlert
          isOpen={deleteAlert.show}
          header="Confirmar Exclusão"
          message="Tem certeza que deseja excluir este jogo?"
          buttons={[
            { text: 'Cancelar', role: 'cancel', handler: () => setDeleteAlert({show: false, id: null}) },
            { text: 'Excluir', handler: handleDelete }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default CacaPalavrasManagement;
