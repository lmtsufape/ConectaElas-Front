import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonAlert,
  IonToast,
  IonModal,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { close } from "ionicons/icons";
import api from "../Services/api";
import { getAllQuizzes } from "../Services/QuizService";
import "./QuizManagement.css";

// Componentes
import QuizList from "../components/QuizList/QuizList";
import QuizForm from "../components/QuizForm/QuizForm";

// Interfaces
interface Quiz {
  id: number;
  Titulo: string;
  perguntas: Pergunta[];
}

interface Pergunta {
  id: number;
  Questao: string;
  respostas: Resposta[];
}

interface Resposta {
  id: number;
  Resposta: string;
  Correcao: boolean;
  Explicacao?: string;
}

interface NovoQuiz {
  titulo: string;
  perguntas: NovaPergunta[];
}

interface NovaPergunta {
  questao: string;
  respostas: NovaResposta[];
}

interface NovaResposta {
  texto: string;
  correta: boolean;
  explicacao: string;
}

const QuizManagement: React.FC = () => {
  const history = useHistory();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  const [novoQuiz, setNovoQuiz] = useState<NovoQuiz>({
    titulo: "",
    perguntas: [{ questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
  });

  const [quizParaEditar, setQuizParaEditar] = useState<NovoQuiz>({
    titulo: "",
    perguntas: [{ questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
  });
  
  const [quizIdParaEditar, setQuizIdParaEditar] = useState<number | null>(null);
  const [quizAtual, setQuizAtual] = useState<Quiz | null>(null);

  // Carregar quizzes ao iniciar
  useEffect(() => {
    loadQuizzes();
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

  // Função para carregar quizzes
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await getAllQuizzes();
      if (response && (response as any).data) {
        setQuizzes((response as any).data ?? []);
      }
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
      showToastMessage("Erro ao carregar quizzes", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Função para mostrar mensagens toast
  const showToastMessage = (message: string, color: "success" | "danger" | "warning") => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Função para criar um novo quiz
  const handleCreateQuiz = async () => {
    try {
      // Validar dados
      if (!novoQuiz.titulo.trim()) {
        showToastMessage("O título do quiz é obrigatório", "warning");
        return;
      }

      // Criar quiz no Strapi
      const quizResponse = await api.post("/quizzes", {
        data: {
          Titulo: novoQuiz.titulo
        }
      });

      const quizId = quizResponse.data.data.id;

      // Criar perguntas e respostas
      for (const pergunta of novoQuiz.perguntas) {
        if (!pergunta.questao.trim()) continue;

        // Criar pergunta
        const perguntaResponse = await api.post("/perguntas", {
          data: {
            Questao: pergunta.questao,
            quiz: {
              id: quizId
            }
          }
        });

        const perguntaId = perguntaResponse.data.data.id;

        // Criar respostas
        for (const resposta of pergunta.respostas) {
          if (!resposta.texto.trim()) continue;

          await api.post("/respostas", {
            data: {
              Resposta: resposta.texto,
              Correcao: resposta.correta,
              Explicacao: resposta.explicacao,
              pergunta: {
                id: perguntaId
              }
            }
          });
        }
      }

      // Recarregar quizzes
      await loadQuizzes();

      // Limpar formulário e fechar modal
      setNovoQuiz({
        titulo: "",
        perguntas: [{ questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
      });
      setShowCreateModal(false);

      showToastMessage("Quiz criado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao criar quiz:", error);
      showToastMessage("Erro ao criar quiz", "danger");
    }
  };

  // Função para carregar os dados do quiz para edição
  const onEditQuiz = async (id: number) => {
    try {
      setLoading(true);
      
      // Buscar o quiz completo com perguntas e respostas
      const response = await api.get(`/quizzes?filters[id][$eq]=${id}&populate[perguntas][populate]=respostas`);
      const quizzes = response.data.data;
      
      if (!quizzes || quizzes.length === 0) {
        throw new Error('Quiz não encontrado');
      }
      
      const quizCompleto = quizzes[0];
      // Formatar os dados para o formato do formulário de edição
      const quizFormatado: NovoQuiz = {
        titulo: quizCompleto.Titulo || '',
        perguntas: []
      };
      
      // Adicionar perguntas e respostas
      if (quizCompleto.perguntas) {
        quizFormatado.perguntas = quizCompleto.perguntas.map((pergunta: any) => {
          const novaPergunta: NovaPergunta = {
            questao: pergunta.Questao || '',
            respostas: []
          };
          
          // Adicionar respostas
          if (pergunta.respostas) {
            novaPergunta.respostas = pergunta.respostas.map((resposta: any) => {
              return {
                texto: resposta.Resposta || '',
                correta: resposta.Correcao || false,
                explicacao: resposta.Explicacao === null ? '' : resposta.Explicacao || ''
              };
            });
          }
          
          // Garantir que há pelo menos duas respostas
          if (novaPergunta.respostas.length < 2) {
            const respostasAdicionais = 2 - novaPergunta.respostas.length;
            for (let i = 0; i < respostasAdicionais; i++) {
              novaPergunta.respostas.push({
                texto: '', correta: false,
                explicacao: ""
              });
            }
          }
          
          return novaPergunta;
        });
      }
      
      // Se não houver perguntas, adicionar uma pergunta vazia
      if (quizFormatado.perguntas.length === 0) {
        quizFormatado.perguntas = [{ 
          questao: "", 
          respostas: [{
            texto: "", correta: false,
            explicacao: ""
          }, {
            texto: "", correta: false,
            explicacao: ""
          }] 
        }];
      }
      
      // Atualizar o estado com os dados do quiz para edição
      setQuizParaEditar(quizFormatado);
      setQuizIdParaEditar(id);
      setShowEditModal(true);
      
    } catch (error) {
      console.error("Erro ao preparar quiz para edição:", error);
      showToastMessage("Erro ao preparar quiz para edição", "danger");
    } finally {
      setLoading(false);
    }
  };

// Função para atualizar um quiz existente
const handleUpdateQuiz = async () => {
  try {
    // Prevenir duplo clique
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    // Validar dados
    if (!quizParaEditar.titulo.trim()) {
      showToastMessage("O título do quiz é obrigatório", "warning");
      setIsUpdating(false);
      return;
    }
    
    if (!quizIdParaEditar) {
      showToastMessage("ID do quiz não encontrado", "danger");
      setIsUpdating(false);
      return;
    }
    // Buscar o quiz completo para obter o documentId e as perguntas/respostas atuais
    const response = await api.get(`/quizzes?filters[id][$eq]=${quizIdParaEditar}&populate[perguntas][populate]=respostas`);
    const quizzes = response.data.data;
    
    if (!quizzes || quizzes.length === 0) {
      throw new Error('Quiz não encontrado');
    }
    
    const quizCompleto = quizzes[0];
    const documentId = quizCompleto.documentId;
    // Atualizar o quiz no Strapi usando documentId
    const quizAtualizado = await api.put(`/quizzes/${documentId || quizIdParaEditar}`, {
      data: {
        Titulo: quizParaEditar.titulo
      }
    });
    
    // Pegar o ID do quiz atualizado
    const quizAtualizadoId = quizAtualizado.data.data.id;
    // Excluir perguntas e respostas antigas usando a mesma estrutura da função de deletar
    if (quizCompleto?.perguntas) {
      for (const pergunta of quizCompleto.perguntas) {
        if (pergunta?.respostas) {
          for (const resposta of pergunta.respostas) {
            await api.delete(`/respostas/${resposta.documentId || resposta.id}`);
          }
        }
        await api.delete(`/perguntas/${pergunta.documentId || pergunta.id}`);
      }
    }
    
    // Criar novas perguntas e respostas usando o ID do quiz atualizado
    for (const pergunta of quizParaEditar.perguntas) {
      if (!pergunta.questao.trim()) continue;

      // Criar pergunta
      const perguntaResponse = await api.post("/perguntas", {
        data: {
          Questao: pergunta.questao,
          quiz: {
            id: quizAtualizadoId  // Usar o ID do quiz atualizado
          }
        }
      });

      const perguntaId = perguntaResponse.data.data.id;

      // Criar respostas
      for (const resposta of pergunta.respostas) {
        if (!resposta.texto.trim()) continue;

        await api.post("/respostas", {
          data: {
            Resposta: resposta.texto,
            Correcao: resposta.correta,
            Explicacao: resposta.explicacao,
            pergunta: {
              id: perguntaId
            }
          }
        });
      }
    }

    // Recarregar quizzes
    await loadQuizzes();

    // Limpar formulário e fechar modal
    setQuizParaEditar({
      titulo: "",
      perguntas: [{ questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
    });
    setQuizIdParaEditar(null);
    setShowEditModal(false);

    showToastMessage("Quiz atualizado com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao atualizar quiz:", error);
    showToastMessage("Erro ao atualizar quiz", "danger");
  } finally {
    setIsUpdating(false);
  }
};

  // Deletar quiz
  const handleDeleteQuiz = async (id: number) => {
    try {
      // Primeiro, buscar o quiz para obter o documentId
      const quizResponse = await api.get(`/quizzes?filters[id][$eq]=${id}&populate[perguntas][populate]=respostas`);
      const quizzes = quizResponse.data.data;

      if (!quizzes || quizzes.length === 0) {
        throw new Error('Quiz não encontrado');
      }

      const quiz = quizzes[0];
      const documentId = quiz.documentId;
      // Excluir perguntas e respostas usando o quiz encontrado
      if (quiz?.perguntas) {
        for (const pergunta of quiz.perguntas) {
          if (pergunta?.respostas) {
            for (const resposta of pergunta.respostas) {
              await api.delete(`/respostas/${resposta.documentId || resposta.id}`);
            }
          }
          await api.delete(`/perguntas/${pergunta.documentId || pergunta.id}`);
        }
      }
      // Excluir o quiz usando documentId
      await api.delete(`/quizzes/${documentId || id}`);

      // Atualizar estado
      setQuizzes(prev => prev.filter(q => q.id !== id));
      showToastMessage("Quiz excluído com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao excluir quiz:", error);
      showToastMessage("Erro ao excluir quiz", "danger");
    }
  };

  // Funções para manipular o formulário de criação
  const handleTituloChange = (value: string) => {
    setNovoQuiz(prev => ({ ...prev, titulo: value }));
  };

  const handleQuestaoChange = (index: number, value: string) => {
    const perguntas = [...novoQuiz.perguntas];
    perguntas[index].questao = value;
    setNovoQuiz(prev => ({ ...prev, perguntas }));
  };

  const handleRespostaChange = (perguntaIndex: number, respostaIndex: number, value: string) => {
    setNovoQuiz(prev => {
      const novasPerguntas = [...prev.perguntas];
      const novaPergunta = { ...novasPerguntas[perguntaIndex] };
      const novasRespostas = [...novaPergunta.respostas];
      
      novasRespostas[respostaIndex] = {
        ...novasRespostas[respostaIndex],
        texto: value
      };
      
      novaPergunta.respostas = novasRespostas;
      novasPerguntas[perguntaIndex] = novaPergunta;
      
      return { ...prev, perguntas: novasPerguntas };
    });
  };

  const handleCorrecaoChange = (perguntaIndex: number, respostaIndex: number, value: boolean) => {
    setNovoQuiz(prev => {
      const novasPerguntas = [...prev.perguntas];
      const novaPergunta = { ...novasPerguntas[perguntaIndex] };
      const novasRespostas = [...novaPergunta.respostas];
      
      novasRespostas[respostaIndex] = {
        ...novasRespostas[respostaIndex],
        correta: value
      };
      
      novaPergunta.respostas = novasRespostas;
      novasPerguntas[perguntaIndex] = novaPergunta;
      
      return { ...prev, perguntas: novasPerguntas };
    });
  };
  
  const handleExplicacaoChange = (perguntaIndex: number, respostaIndex: number, value: string) => {
    const perguntas = [...novoQuiz.perguntas];
    perguntas[perguntaIndex].respostas[respostaIndex].explicacao = value;
    setNovoQuiz(prev => ({ ...prev, perguntas }));
  };

  const addPergunta = () => {
    setNovoQuiz(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
    }));
  };

  const removePergunta = (index: number) => {
    if (novoQuiz.perguntas.length <= 1) return;

    const perguntas = [...novoQuiz.perguntas];
    perguntas.splice(index, 1);
    setNovoQuiz(prev => ({ ...prev, perguntas }));
  };

  const addResposta = (perguntaIndex: number) => {
    const perguntas = [...novoQuiz.perguntas];
    perguntas[perguntaIndex].respostas.push({ texto: "", correta: false, explicacao: "" });
    setNovoQuiz(prev => ({ ...prev, perguntas }));
  };

  const removeResposta = (perguntaIndex: number, respostaIndex: number) => {
    if (novoQuiz.perguntas[perguntaIndex].respostas.length <= 2) return;

    const perguntas = [...novoQuiz.perguntas];
    perguntas[perguntaIndex].respostas.splice(respostaIndex, 1);
    setNovoQuiz(prev => ({ ...prev, perguntas }));
  };

  // Funções para manipular o formulário de edição
  const handleTituloEditChange = (value: string) => {
    setQuizParaEditar(prev => ({ ...prev, titulo: value }));
  };

  const handleQuestaoEditChange = (index: number, value: string) => {
    const perguntas = [...quizParaEditar.perguntas];
    perguntas[index].questao = value;
    setQuizParaEditar(prev => ({ ...prev, perguntas }));
  };

  const handleRespostaEditChange = (perguntaIndex: number, respostaIndex: number, value: string) => {
    setQuizParaEditar(prev => {
      const novasPerguntas = [...prev.perguntas];
      const novaPergunta = { ...novasPerguntas[perguntaIndex] };
      const novasRespostas = [...novaPergunta.respostas];
      
      novasRespostas[respostaIndex] = {
        ...novasRespostas[respostaIndex],
        texto: value
      };
      
      novaPergunta.respostas = novasRespostas;
      novasPerguntas[perguntaIndex] = novaPergunta;
      
      return { ...prev, perguntas: novasPerguntas };
    });
  };

  const handleCorrecaoEditChange = (perguntaIndex: number, respostaIndex: number, value: boolean) => {
    setQuizParaEditar(prev => {
      const novasPerguntas = [...prev.perguntas];
      const novaPergunta = { ...novasPerguntas[perguntaIndex] };
      const novasRespostas = [...novaPergunta.respostas];
      
      novasRespostas[respostaIndex] = {
        ...novasRespostas[respostaIndex],
        correta: value
      };
      
      novaPergunta.respostas = novasRespostas;
      novasPerguntas[perguntaIndex] = novaPergunta;
      
      return { ...prev, perguntas: novasPerguntas };
    });
  };
  
  const handleExplicacaoEditChange = (perguntaIndex: number, respostaIndex: number, value: string) => {
    const perguntas = [...quizParaEditar.perguntas];
    perguntas[perguntaIndex].respostas[respostaIndex].explicacao = value;
    setQuizParaEditar(prev => ({ ...prev, perguntas }));
  };

  const addPerguntaEdit = () => {
    setQuizParaEditar(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
    }));
  };

  const removePerguntaEdit = (index: number) => {
    if (quizParaEditar.perguntas.length <= 1) return;

    const perguntas = [...quizParaEditar.perguntas];
    perguntas.splice(index, 1);
    setQuizParaEditar(prev => ({ ...prev, perguntas }));
  };

  const addRespostaEdit = (perguntaIndex: number) => {
    const perguntas = [...quizParaEditar.perguntas];
    perguntas[perguntaIndex].respostas.push({
      texto: "", correta: false,
      explicacao: ""
    });
    setQuizParaEditar(prev => ({ ...prev, perguntas }));
  };

  const removeRespostaEdit = (perguntaIndex: number, respostaIndex: number) => {
    if (quizParaEditar.perguntas[perguntaIndex].respostas.length <= 2) return;

    const perguntas = [...quizParaEditar.perguntas];
    perguntas[perguntaIndex].respostas.splice(respostaIndex, 1);
    setQuizParaEditar(prev => ({ ...prev, perguntas }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/games" />
          </IonButtons>
          <IonTitle className="title-centered">Gerenciamento de Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div>
          <QuizList
            quizzes={quizzes}
            loading={loading}
            onViewProgress={() => history.push('/tabs/quiz-progress')}
            onCreateClick={() => {
              setNovoQuiz({
                titulo: "",
                perguntas: [{ questao: "", respostas: [{ texto: "", correta: false, explicacao: "" }, { texto: "", correta: false, explicacao: "" }] }]
              });
              setShowCreateModal(true);
            }}
            onEditQuiz={(quiz) => {
              onEditQuiz(quiz.id);
            }}
            onDeleteQuiz={(quiz) => {
              setQuizAtual(quiz);
              setShowDeleteAlert(true);
            }}
          />
        </div>

  {/* Modal de Criação de Quiz */}
<IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
  <IonHeader>
    <IonToolbar className="header-gradient">
      <IonTitle className="title-centered">Criar Novo Quiz</IonTitle>
      <IonButtons slot="end">
        <IonButton
          className="close-button"
          fill="clear"
          onClick={() => setShowCreateModal(false)}
        >
          <IonIcon icon={close} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>

  <QuizForm
    isOpen={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    quiz={novoQuiz}
    isEditing={false}
    onTituloChange={handleTituloChange}
    onQuestaoChange={handleQuestaoChange}
    onRespostaChange={handleRespostaChange}
    onCorrecaoChange={handleCorrecaoChange}
    onExplicacaoChange={handleExplicacaoChange} // Corrigido
    onAddPergunta={addPergunta}
    onRemovePergunta={removePergunta}
    onAddResposta={addResposta}
    onRemoveResposta={removeResposta}
    onSave={handleCreateQuiz}
  />
</IonModal>

{/* Modal de Edição de Quiz */}
<IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
  <IonHeader>
    <IonToolbar className="header-gradient">
      <IonTitle className="title-centered">Editar Quiz</IonTitle>
      <IonButtons slot="end">
        <IonButton
          className="close-button"
          fill="clear"
          onClick={() => setShowEditModal(false)}
        >
          <IonIcon icon={close} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>

  <QuizForm
    isOpen={showEditModal}
    onClose={() => setShowEditModal(false)}
    quiz={quizParaEditar}
    isEditing={true}
    isUpdating={isUpdating}
    onTituloChange={handleTituloEditChange}
    onQuestaoChange={handleQuestaoEditChange}
    onRespostaChange={handleRespostaEditChange}
    onCorrecaoChange={handleCorrecaoEditChange}
    onExplicacaoChange={handleExplicacaoEditChange} // Corrigido
    onAddPergunta={addPerguntaEdit}
    onRemovePergunta={removePerguntaEdit}
    onAddResposta={addRespostaEdit}
    onRemoveResposta={removeRespostaEdit}
    onSave={handleUpdateQuiz}
  />
</IonModal>
        {/* Alerta de Confirmação de Exclusão */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={"Confirmar Exclusão"}
          message={`Tem certeza que deseja excluir o quiz "${quizAtual?.Titulo}"?`}
          buttons={[
            {
              text: "Cancelar",
              role: "cancel",
              handler: () => {
                setQuizAtual(null);
                setShowDeleteAlert(false);
              }
            },
            {
              text: "Excluir",
              handler: () => {
                if (quizAtual) {
                  handleDeleteQuiz(quizAtual.id);
                  setQuizAtual(null);
                }
              }
            }
          ]}
        />

        {/* Toast de Mensagens */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default QuizManagement;
