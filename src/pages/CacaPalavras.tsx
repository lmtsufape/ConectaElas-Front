import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonModal,
  IonButton,
  IonIcon,
  IonToast,
  useIonViewDidLeave,
} from "@ionic/react";
import "./CacaPalavras.css";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import api from "../Services/api";
import { criarPontuacao } from "../Services/PontuacaoService";
import { checkmarkCircle } from "ionicons/icons";

interface CacaPalavrasData {
  id?: number;
  documentId?: string;
  titulo: string;
  palavras: string[];
  grade: {
    linhas: number;
    colunas: number;
    grade: string[][];
  };
}

function gerarGrid(palavras: string[], N = 8) {
  const grid: string[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => "*"),
  );

  function podeColocar(
    palavra: string,
    row: number,
    col: number,
    vertical: boolean,
  ) {
    for (let i = 0; i < palavra.length; i++) {
      const r = vertical ? row + i : row;
      const c = vertical ? col : col + i;
      if (grid[r][c] !== "*" && grid[r][c] !== palavra[i]) return false;
    }
    return true;
  }

  function colocar(
    palavra: string,
    row: number,
    col: number,
    vertical: boolean,
  ) {
    for (let i = 0; i < palavra.length; i++) {
      const r = vertical ? row + i : row;
      const c = vertical ? col : col + i;
      grid[r][c] = palavra[i];
    }
  }

  for (const p of palavras) {
    const palavra = p.toUpperCase();
    let colocada = false;
    let tentativas = 0;

    while (!colocada && tentativas < 100) {
      tentativas++;
      const vertical = Math.random() < 0.5;

      const row = vertical
        ? Math.floor(Math.random() * (N - palavra.length + 1))
        : Math.floor(Math.random() * N);

      const col = vertical
        ? Math.floor(Math.random() * N)
        : Math.floor(Math.random() * (N - palavra.length + 1));

      if (podeColocar(palavra, row, col, vertical)) {
        colocar(palavra, row, col, vertical);
        colocada = true;
      }
    }
  }

  // Preencher vazios
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (grid[i][j] === "*") {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return {
    linhas: N,
    colunas: N,
    grade: grid,
  };
}

const CacaPalavras: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const { user } = useAuth();
  const [data, setData] = useState<CacaPalavrasData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");
  const [salvandoPontuacao, setSalvandoPontuacao] = useState<boolean>(false);
  const [pontuacaoSalva, setPontuacaoSalva] = useState<boolean>(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(
    null,
  );

  const searchParams = new URLSearchParams(location.search);
  const fromManagement = searchParams.get("from") === "management";

  useEffect(() => {
    const load = async () => {
      try {
        let endpoint = "/caca-palavras";
        // Verifica se é um ID numérico (Strapi v4/v5 integer ID) ou documentId (string)
        if (!isNaN(Number(id))) {
          endpoint += `?filters[id][$eq]=${id}`;
        } else {
          endpoint += `?filters[documentId][$eq]=${id}`;
        }

        const res = await api.get(endpoint);
        const json = res.data;
        const base = Array.isArray(json?.data)
          ? json.data[0]
          : json?.data || json?.[0];

        if (base) {
          const novaGrade = gerarGrid(base.palavras);
          setData({ ...base, grade: novaGrade });
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Erro ao carregar caça-palavras", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useIonViewDidLeave(() => {
    if (user?.id && data && foundWords.length > 0 && !pontuacaoSalva) {
      salvarPontuacaoNoBackend();
    }
  });

  const selectCell = (row: number, col: number) => {
    if (!data) return;
    if (!startCell) {
      setStartCell({ row, col });
      const key = `${row}-${col}`;
      setSelectedCells([key]);
      setCurrentWord(data.grade.grade[row][col]);
    } else {
      // Verifica se está na mesma linha ou mesma coluna
      if (row === startCell.row || col === startCell.col) {
        const newSelectedCells: string[] = [];
        let newCurrentWord = "";

        const startR = Math.min(startCell.row, row);
        const endR = Math.max(startCell.row, row);
        const startC = Math.min(startCell.col, col);
        const endC = Math.max(startCell.col, col);

        if (row === startCell.row) {
          // Horizontal
          for (let c = startC; c <= endC; c++) {
            newSelectedCells.push(`${row}-${c}`);
            newCurrentWord += data.grade.grade[row][c];
          }
        } else {
          // Vertical
          for (let r = startR; r <= endR; r++) {
            newSelectedCells.push(`${r}-${col}`);
            newCurrentWord += data.grade.grade[r][col];
          }
        }

        // Ajusta a palavra se estiver selecionando de trás para frente
        if (row < startCell.row || col < startCell.col) {
          newCurrentWord = "";
          if (row === startCell.row) {
            for (let c = startCell.col; c >= col; c--) {
              newCurrentWord += data.grade.grade[row][c];
            }
          } else {
            for (let r = startCell.row; r >= row; r--) {
              newCurrentWord += data.grade.grade[r][col];
            }
          }
        }

        setSelectedCells(newSelectedCells);
        setCurrentWord(newCurrentWord);
      }
    }
  };

  const finalizeSelection = () => {
    if (!data || selectedCells.length === 0) {
      setIsSelecting(false);
      setStartCell(null);
      return;
    }

    const word = currentWord.toUpperCase();

    if (data.palavras.includes(word) && !foundWords.includes(word)) {
      const updatedWords = [...foundWords, word];
      setFoundWords(updatedWords);
      setFoundCells((prev) => [...prev, ...selectedCells]);

      if (updatedWords.length === data.palavras.length) {
        setShowEndModal(true);
        salvarPontuacaoNoBackend();
      }
    }

    setSelectedCells([]);
    setCurrentWord("");
    setIsSelecting(false);
    setStartCell(null);
  };

  const restartGame = () => {
    if (!data) return;
    const novaGrade = gerarGrid(data.palavras, data.grade?.linhas ?? 8);
    setData((prev) => (prev ? { ...prev, grade: novaGrade } : prev));
    setSelectedCells([]);
    setCurrentWord("");
    setFoundWords([]);
    setFoundCells([]);
    setIsSelecting(false);
    setShowEndModal(false);
  };

  const salvarPontuacaoNoBackend = async () => {
    if (!user?.id || !data || salvandoPontuacao || pontuacaoSalva) return;

    setSalvandoPontuacao(true);
    try {
      const resultado = await criarPontuacao({
        jogo: "cacapalavras" as const,
        acertos: foundWords.length,
        totalPerguntas: data.palavras.length,
        users_permissions_user: user.id,
        itemTitle: data.titulo,
      });

      if (resultado.sucesso) {
        setToastMessage(
          `✅ Pontuação salva: ${resultado.pontuacao?.total} pontos!`,
        );
        setToastColor("success");
        setPontuacaoSalva(true);
      } else {
        setToastMessage(`⚠️ Erro ao salvar: ${resultado.erro}`);
        setToastColor("warning");
      }
    } catch (error) {
      console.error("Erro ao salvar pontuação:", error);
      setToastMessage("Erro ao salvar pontuação");
      setToastColor("danger");
    } finally {
      setSalvandoPontuacao(false);
      setShowToast(true);
    }
  };

  const goToThemes = () => {
    setShowEndModal(false);
    if (fromManagement) {
      history.replace("/tabs/caca-palavras-management");
    } else {
      history.replace("/tabs/games/caca-palavras");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !el.classList.contains("caca-cell")) return;
    const row = el.getAttribute("data-row");
    const col = el.getAttribute("data-col");
    if (row && col) {
      selectCell(Number(row), Number(col));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el || !el.classList.contains("caca-cell")) return;
    const row = el.getAttribute("data-row");
    const col = el.getAttribute("data-col");
    if (row && col) {
      selectCell(Number(row), Number(col));
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/games" />
            </IonButtons>
            <IonTitle>Carregando</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="caca-content ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Carregando caça-palavras...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!data) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/games/caca-palavras" />
            </IonButtons>
            <IonTitle>Erro</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="caca-content ion-padding">
          <p>Não foi possível carregar o jogo.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/games/caca-palavras" />
          </IonButtons>
          <IonTitle>{data.titulo}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="caca-content">
        <div className="caca-container">
          <IonModal
            isOpen={showEndModal}
            className="end-modal"
            backdropDismiss={false}
          >
            <div className="modal-box">
              <div className="modal-title">Parabéns!</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "10px 0",
                }}
              >
                <IonIcon
                  icon={checkmarkCircle}
                  style={{ color: "#2dd36f", fontSize: "64px" }}
                />
              </div>
              <div className="modal-message">
                Você encontrou todas as palavras do caça-palavras!
              </div>
              <div className="modal-actions">
                <IonButton onClick={restartGame}>Reiniciar jogo</IonButton>
                <IonButton fill="outline" onClick={goToThemes}>
                  Voltar para temas
                </IonButton>
              </div>
            </div>
          </IonModal>

          <div
            className="caca-grid"
            style={{
              gridTemplateColumns: `repeat(${data.grade.colunas}, 1fr)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={finalizeSelection}
            onMouseLeave={finalizeSelection}
            onTouchMove={handleTouchMove}
            onTouchEnd={finalizeSelection}
          >
            {data.grade.grade.map((linha, i) =>
              linha.map((letra, j) => {
                const key = `${i}-${j}`;
                const isSelected = selectedCells.includes(key);
                const isFound = foundCells.includes(key);

                return (
                  <div
                    key={key}
                    className={`caca-cell ${isSelected ? "selected" : ""} ${
                      isFound ? "found" : ""
                    }`}
                    data-row={i}
                    data-col={j}
                    data-letter={letra}
                    onMouseDown={() => {
                      setIsSelecting(true);
                      selectCell(i, j);
                    }}
                    onTouchStart={() => {
                      setIsSelecting(true);
                      selectCell(i, j);
                    }}
                  >
                    {letra}
                  </div>
                );
              }),
            )}
          </div>

          <div className="palavras">
            <h3>Palavras</h3>
            <ul>
              {data.palavras.map((p) => (
                <li key={p} className={foundWords.includes(p) ? "found" : ""}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default CacaPalavras;
