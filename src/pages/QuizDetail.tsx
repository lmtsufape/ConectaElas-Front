import React, { useEffect, useState, useTransition } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { useIonViewWillEnter } from "@ionic/react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonAlert,
  IonToast,
} from "@ionic/react";
import { arrowBackOutline, checkmarkCircleOutline, checkmarkCircle } from "ionicons/icons";
import { getQuizById, QuizResult } from "../Services/QuizService";
import { useAuth } from "../Contexts/AuthContext";
import { criarPontuacao } from "../Services/PontuacaoService";
import "./QuizDetail.css";

interface RouteParams {
  id: string;
}

interface Pergunta {
  id: number;
  Questao: string;
  opcoes?: string[];
  opcoesCorretas?: boolean[];
  opcoesExplicacoes?: string[];
}

interface Quiz {
  id: number;
  Titulo: string;
  perguntas: Pergunta[];
}

const QuizDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const location = useLocation();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const searchParams = new URLSearchParams(location.search);
  const fromManagement = searchParams.get("from") === "management";
  const quizListHref = fromManagement ? "/tabs/quiz-management" : "/tabs/quiz";

  useIonViewWillEnter(() => {
    setCurrentQuestionIndex(0);
    setRespostas({});
    localStorage.removeItem("quizResult");
  });

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await getQuizById(parseInt(id));

        if (response && response.data) {
          setQuiz(response.data);
        } else {
          setQuiz(null);
        }
      } catch (error) {
        console.error("Erro ao carregar quiz:", error);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    const handler = (ev: any) => {
      ev.detail.register(10, () => {
        history.replace(quizListHref);
      });
    };
    document.addEventListener("ionBackButton", handler as any);
    return () => document.removeEventListener("ionBackButton", handler as any);
  }, [history, quizListHref]);

  const handleRespostaChange = (perguntaId: number, resposta: string) => {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: resposta,
    }));
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    if (currentQuestionIndex < quiz.perguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finalizarQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finalizarQuiz = () => {
    if (!quiz) return;
    const todasRespondidas = quiz.perguntas.every(
      (pergunta) => respostas[pergunta.id] !== undefined
    );

    if (!todasRespondidas) {
      setShowAlert(true);
      return;
    }
    localStorage.removeItem("quizResult");
    const resultado: QuizResult = {
      quizId: quiz.id,
      quizTitle: quiz.Titulo,
      totalPerguntas: quiz.perguntas.length,
      respostas: quiz.perguntas.map((pergunta) => {
        const respostaUsuario = respostas[pergunta.id] || "";
        let correta = false;
        let corretaResposta = "";
        let explicacaoSelecionada = "Sem explicação disponível.";

        if (pergunta.opcoes && pergunta.opcoesCorretas && pergunta.opcoesExplicacoes) {
          const indexResposta = pergunta.opcoes.findIndex(opcao => opcao === respostaUsuario);
          if (indexResposta !== -1) {
            correta = pergunta.opcoesCorretas[indexResposta];
            explicacaoSelecionada = pergunta.opcoesExplicacoes[indexResposta];
          }
          const indexCorreta = pergunta.opcoesCorretas.findIndex(opcaoCorreta => opcaoCorreta === true);
          if (indexCorreta !== -1) {
            corretaResposta = pergunta.opcoes[indexCorreta];
          }
        } else {
          corretaResposta = "Sim";
          correta = respostaUsuario === "Sim";
          explicacaoSelecionada = {
            "Sim": "Você escolheu 'Sim', que é a resposta correta para esta pergunta.",
            "Não": "Você escolheu 'Não', mas a resposta correta é 'Sim'.",
            "Talvez": "Você escolheu 'Talvez', mas a resposta correta é 'Sim'."
          }[respostaUsuario] || "Sem explicação disponível.";
        }

        return {
          perguntaId: pergunta.id,
          pergunta: pergunta.Questao,
          resposta: respostaUsuario,
          correta: correta,
          corretaResposta: corretaResposta,
          explicacao: explicacaoSelecionada
        };
      }),
    };

    try {
      const resultadoString = JSON.stringify(resultado);
      localStorage.setItem("quizResult", resultadoString);
      startTransition(() => {
        const query = fromManagement ? "?from=management" : "";
        history.replace(`/tabs/quiz-result/${quiz.id}${query}`);
      });
    } catch (error) {
      console.error("Erro ao salvar resultado no localStorage:", error);
      alert("Ocorreu um erro ao salvar o resultado do quiz. Por favor, tente novamente.");
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref={quizListHref} />
            </IonButtons>
            <IonTitle className="title-centered">Carregando Quiz</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding quiz-detail-container">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Carregando perguntas...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!quiz) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref={quizListHref} />
            </IonButtons>
            <IonTitle className="title-centered">Quiz não encontrado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding quiz-detail-container">
          <div className="error-container">
            <p>Não foi possível encontrar o quiz solicitado.</p>
            <p>O quiz com ID {id} pode ter sido removido ou não existe na base de dados.</p>
            <IonButton routerLink="/tabs/quiz" className="nav-button">Voltar para a lista de quizzes</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const currentQuestion = quiz.perguntas[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.perguntas.length - 1;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref={quizListHref} />
          </IonButtons>
          <IonTitle className="title-centered">{quiz.Titulo}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding quiz-detail-container">
        <div className="quiz-progress">
          <span>
            Pergunta {currentQuestionIndex + 1} de {quiz.perguntas.length}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.perguntas.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <IonCard className="question-card" key={`question-${currentQuestionIndex}`}>
          <IonCardHeader>
            <IonCardTitle className="question-title">
              {currentQuestion.Questao}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonRadioGroup
              value={respostas[currentQuestion.id] || ""}
              onIonChange={(e) =>
                handleRespostaChange(currentQuestion.id, e.detail.value)
              }
            >
              {currentQuestion.opcoes && currentQuestion.opcoes.map((opcao, index) => (
                <IonItem
                  key={index}
                  className={`option-item ${respostas[currentQuestion.id] === opcao ? 'selected' : ''}`}
                >
                  <IonLabel>{opcao}</IonLabel>
                  <IonRadio slot="start" value={opcao} />
                </IonItem>
              ))}
              {(!currentQuestion.opcoes || currentQuestion.opcoes.length === 0) && (
                <>
                  <IonItem className={`option-item ${respostas[currentQuestion.id] === "Sim" ? 'selected' : ''}`}>
                    <IonLabel>Sim</IonLabel>
                    <IonRadio slot="start" value="Sim" />
                  </IonItem>
                  <IonItem className={`option-item ${respostas[currentQuestion.id] === "Não" ? 'selected' : ''}`}>
                    <IonLabel>Não</IonLabel>
                    <IonRadio slot="start" value="Não" />
                  </IonItem>
                  <IonItem className={`option-item ${respostas[currentQuestion.id] === "Talvez" ? 'selected' : ''}`}>
                    <IonLabel>Talvez</IonLabel>
                    <IonRadio slot="start" value="Talvez" />
                  </IonItem>
                </>
              )}
            </IonRadioGroup>
          </IonCardContent>
        </IonCard>

        <div className="navigation-buttons">
          {currentQuestionIndex > 0 && (
            <IonButton
              fill="outline"
              onClick={handlePreviousQuestion}
              className="nav-button"
            >
              <IonIcon slot="start" icon={arrowBackOutline} />
              Anterior
            </IonButton>
          )}

          <IonButton
            onClick={handleNextQuestion}
            className="nav-button"
            disabled={!respostas[currentQuestion.id]}
          >
            {isLastQuestion ? (
              <>
                Finalizar
                <IonIcon slot="end" icon={checkmarkCircleOutline} />
              </>
            ) : (
              "Próxima"
            )}
          </IonButton>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={"Atenção"}
        message={"Por favor, responda a pergunta atual antes de continuar."}
        buttons={["OK"]}
      />
    </IonPage>
  );
};

export default QuizDetail;
