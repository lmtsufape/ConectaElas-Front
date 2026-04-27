import React, { useEffect, useState, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonToast,
  IonModal,
  IonButton,
  IonIcon,
  useIonViewDidLeave,
} from "@ionic/react";
import "./PalavrasCruzadas.css";
import { useParams, useHistory } from "react-router-dom";
import { trophyOutline, refreshOutline, listOutline } from "ionicons/icons";
import { useAuth } from "../Contexts/AuthContext";
import { criarPontuacao } from "../Services/PontuacaoService";

interface CruzadaData {
  titulo: string;
  palavras: string[];
  dicas: string[];
  grade: {
    linhas: number;
    colunas: number;
    grade: (string | null)[][];
  };
}

interface Pista {
  number: number;
  direction: "H" | "V";
  row: number;
  col: number;
  answer: string;
  dica: string;
}

const PalavrasCruzadas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user, isAssistant } = useAuth();
  const [data, setData] = useState<CruzadaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userGrid, setUserGrid] = useState<(string | null)[][]>([]);
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [active, setActive] = useState<Pista | null>(null);
  const [status, setStatus] = useState<Record<number, "ok" | "err">>({});
  const [solvedCells, setSolvedCells] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");
  const [salvandoPontuacao, setSalvandoPontuacao] = useState<boolean>(false);
  const [pontuacaoSalva, setPontuacaoSalva] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/palavras-cruzadas?filters[id][$eq]=${id}`,
        );
        const json = await res.json();
        const cruzada = json.data && json.data[0] ? json.data[0] : null;

        if (cruzada) {
          setData(cruzada);

          const newGrid = cruzada.grade.grade.map((row: (string | null)[]) =>
            row.map((cell: string | null) => (cell ? "" : null)),
          );
          setUserGrid(newGrid);

          const pistasDetectadas = detectPistas(
            cruzada.grade.grade,
            cruzada.palavras,
            cruzada.dicas,
          );
          setPistas(pistasDetectadas);
        }
      } catch (e) {
        console.error("Erro ao carregar cruzada", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useIonViewDidLeave(() => {
    const pistasResolvidas = pistas.filter(
      (p) => status[p.number] === "ok",
    ).length;
    if (user?.id && pistas && pistas.length > 0 && pistasResolvidas > 0 && !pontuacaoSalva) {
      salvarPontuacaoNoBackend();
    }
  });

  const salvarPontuacaoNoBackend = async () => {
    if (
      !user?.id ||
      !pistas ||
      !data ||
      pistas.length === 0 ||
      salvandoPontuacao ||
      pontuacaoSalva
    )
      return;

    setSalvandoPontuacao(true);
    try {
      const pistasResolvidas = pistas.filter(
        (p) => status[p.number] === "ok",
      ).length;

      const resultado = await criarPontuacao({
        jogo: "palavracruzada" as const,
        acertos: pistasResolvidas,
        totalPerguntas: pistas.length,
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

  useEffect(() => {
    if (pistas.length === 0) return;

    const todasResolvidas = pistas.every((p) => status[p.number] === "ok");
    if (todasResolvidas && !pontuacaoSalva) {
      salvarPontuacaoNoBackend();
      setShowCompletionModal(true);
    }
  }, [status, pistas]);

  const restartGame = () => {
    if (!data) return;
    const newGrid = data.grade.grade.map((row: (string | null)[]) =>
      row.map((cell: string | null) => (cell ? "" : null)),
    );
    setUserGrid(newGrid);
    setStatus({});
    setSolvedCells(new Set());
    setPontuacaoSalva(false);
    setShowCompletionModal(false);
    setActive(null);
  };

  const goToThemes = () => {
    if (data) {
      const cleanGrid = data.grade.grade.map((row: (string | null)[]) =>
        row.map((cell: string | null) => (cell ? "" : null)),
      );
      setUserGrid(cleanGrid);
    }
    setStatus({});
    setSolvedCells(new Set());
    setPontuacaoSalva(false);
    setShowCompletionModal(false);
    setActive(null);

    if (isAssistant || user?.tipo === "SECRETARIO" || user?.tipo === "ADMINISTRADOR") {
      history.replace("/tabs/palavras-cruzadas-management");
    } else {
      history.replace("/tabs/games/palavras-cruzadas");
    }
  };

  const detectPistas = (
    grid: (string | null)[][],
    words: string[],
    dicas: string[],
  ): Pista[] => {
    let tempPistas: Omit<Pista, "number">[] = [];
    const R = grid.length;
    const C = grid[0].length;

    for (let w = 0; w < words.length; w++) {
      const word = words[w].toUpperCase();

      for (let r = 0; r < R; r++) {
        for (let c = 0; c <= C - word.length; c++) {
          let match = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[r][c + i] !== word[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            const prevChar = c > 0 ? grid[r][c - 1] : null;
            const nextChar =
              c + word.length < C ? grid[r][c + word.length] : null;

            if (!prevChar && !nextChar) {
              tempPistas.push({
                direction: "H",
                row: r,
                col: c,
                answer: word,
                dica: dicas[w],
              });
            }
          }
        }
      }

      for (let c = 0; c < C; c++) {
        for (let r = 0; r <= R - word.length; r++) {
          let match = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[r + i][c] !== word[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            const prevChar = r > 0 ? grid[r - 1][c] : null;
            const nextChar =
              r + word.length < R ? grid[r + word.length][c] : null;

            if (!prevChar && !nextChar) {
              tempPistas.push({
                direction: "V",
                row: r,
                col: c,
                answer: word,
                dica: dicas[w],
              });
            }
          }
        }
      }
    }

    tempPistas.sort((a, b) => {
      if (a.row === b.row) return a.col - b.col;
      return a.row - b.row;
    });

    return tempPistas.map((p, index) => ({
      ...p,
      number: index + 1,
    }));
  };

  const handleType = (r: number, c: number, val: string) => {
    if (!active) return;

    const newVal = val.toUpperCase().slice(-1);

    const copy = userGrid.map((row) => [...row]);
    copy[r][c] = newVal;
    setUserGrid(copy);

    pistas.forEach((p) => {
      let intersects = false;
      if (p.direction === "H") {
        if (p.row === r && c >= p.col && c < p.col + p.answer.length)
          intersects = true;
      } else {
        if (p.col === c && r >= p.row && r < p.row + p.answer.length)
          intersects = true;
      }

      if (intersects) {
        checkSpecificWord(copy, p);
      }
    });

    if (newVal !== "") {
      let nr = active.direction === "H" ? r : r + 1;
      let nc = active.direction === "H" ? c + 1 : c;

      // Pula células que já estão preenchidas OU que já foram acertadas
      while (
        copy[nr] !== undefined &&
        copy[nr][nc] !== undefined &&
        (solvedCells.has(`${nr}-${nc}`) || (copy[nr][nc] !== "" && copy[nr][nc] !== null))
      ) {
        const isWithinWord =
          active.direction === "H"
            ? nr === active.row && nc < active.col + active.answer.length
            : nc === active.col && nr < active.row + active.answer.length;

        if (!isWithinWord) break;

        if (active.direction === "H") nc++;
        else nr++;
      }

      const nextInput = inputRefs.current[`cell-${nr}-${nc}`];
      if (nextInput) nextInput.focus();
    }
  };

  const checkSpecificWord = (currentGrid: (string | null)[][], word: Pista) => {
    let formed = "";
    const coords: string[] = [];

    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === "H" ? word.row : word.row + i;
      const c = word.direction === "H" ? word.col + i : word.col;
      formed += currentGrid[r][c] || "";
      coords.push(`${r}-${c}`);
    }

    if (formed === word.answer) {
      setSolvedCells((prev) => {
        const next = new Set(prev);
        coords.forEach((coord) => next.add(coord));
        return next;
      });
      setStatus((s) => ({ ...s, [word.number]: "ok" }));
    } else {
      if (formed.length === word.answer.length) {
        setStatus((s) => ({ ...s, [word.number]: "err" }));
      }
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="loading-container">
          <IonSpinner />
          <p>Carregando Cruzadinha...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!data) {
    return (
      <IonPage>
        <IonContent>
          <p>Não foi possível carregar os dados.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/games/palavras-cruzadas" />
          </IonButtons>
          <IonTitle>{data.titulo}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="cruzada-container">
          <div
            className="cruzada-grid"
            style={{
              gridTemplateColumns: `repeat(${data.grade.colunas}, 1fr)`,
            }}
          >
            {data.grade.grade.map((row, r) =>
              row.map((cell, c) => {
                if (!cell)
                  return <div key={`${r}-${c}`} className="cruzada-empty" />;

                const isSolved = solvedCells.has(`${r}-${c}`);

                const startsHere = pistas.filter(
                  (p) => p.row === r && p.col === c,
                );

                return (
                  <div key={`${r}-${c}`} className="cell-wrapper">
                    {startsHere.map((p) => (
                      <span
                        key={p.number}
                        className={`cell-number ${
                          p.direction === "H" ? "num-h" : "num-v"
                        }`}
                      >
                        {p.number}
                      </span>
                    ))}

                    <input
                      ref={(el) => (inputRefs.current[`cell-${r}-${c}`] = el)}
                      maxLength={1}
                      disabled={isSolved}
                      className={`cruzada-cell ${isSolved ? "cell-ok" : ""}`}
                      value={userGrid[r][c] || ""}
                      onFocus={() => {
                        const pistasAqui = pistas.filter((p) => {
                          if (p.direction === "H") {
                            return (
                              r === p.row &&
                              c >= p.col &&
                              c < p.col + p.answer.length
                            );
                          } else {
                            return (
                              c === p.col &&
                              r >= p.row &&
                              r < p.row + p.answer.length
                            );
                          }
                        });
                        if (pistasAqui.length > 0) {
                          if (
                            !active ||
                            !pistasAqui.find((p) => p.number === active.number)
                          ) {
                            setActive(pistasAqui[0]);
                          }
                        }
                      }}
                      onChange={(e) => handleType(r, c, e.target.value)}
                      onKeyDown={(e) => {
                        const isLetter = /^[a-zA-Z]$/.test(e.key);
                        if (e.key === "Backspace") {
                          e.preventDefault(); // Assume controle total do Backspace

                          // Se a célula atual já foi acertada, não faz nada (embora deva estar disabled)
                          if (solvedCells.has(`${r}-${c}`)) return;

                          const copy = userGrid.map((row) => [...row]);

                          if (userGrid[r][c] !== "" && userGrid[r][c] !== null) {
                            // Se a célula atual tem algo, apenas limpa ela
                            copy[r][c] = "";
                            setUserGrid(copy);
                          } else if (active) {
                            // Se a célula já está vazia, volta para a anterior
                            let pr = active.direction === "H" ? r : r - 1;
                            let pc = active.direction === "H" ? c - 1 : c;

                            // Pula células que já foram acertadas (solved)
                            while (solvedCells.has(`${pr}-${pc}`)) {
                              if (active.direction === "H") pc--;
                              else pr--;
                            }

                            // Verifica se a célula anterior encontrada ainda faz parte da palavra ativa
                            const isWithinWord =
                              active.direction === "H"
                                ? pr === active.row && pc >= active.col
                                : pc === active.col && pr >= active.row;

                            if (isWithinWord) {
                              // Limpa a célula anterior (que não é solved) e foca nela
                              copy[pr][pc] = "";
                              setUserGrid(copy);

                              const prevInput =
                                inputRefs.current[`cell-${pr}-${pc}`];
                              if (prevInput) {
                                prevInput.focus();
                              }
                            }
                          }
                        } else if (!isLetter && e.key !== "Tab") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                );
              }),
            )}
          </div>

          <div className="dicas">
            <h3>Dicas</h3>
            <ul>
              {pistas.map((pista) => (
                <li
                  key={pista.number}
                  className={status[pista.number] === "ok" ? "found" : ""}
                  style={{
                    cursor: "pointer",
                    fontWeight:
                      active?.number === pista.number ? "bold" : "normal",
                    color:
                      active?.number === pista.number
                        ? "#dd2273"
                        : "#666",
                  }}
                  onClick={() => {
                    setActive(pista);
                    const input =
                      inputRefs.current[`cell-${pista.row}-${pista.col}`];
                    input?.focus();
                  }}
                >
                  <strong>{pista.number}.</strong> {pista.dica}
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

        <IonModal
          isOpen={showCompletionModal}
          onDidDismiss={() => setShowCompletionModal(false)}
          className="end-modal"
          backdropDismiss={false}
        >
          <div className="modal-box">
            <div className="modal-title">Jogo finalizado</div>
            <div className="modal-message">
              Que legal! Você chegou até o final
            </div>
            <div className="applause">👏👏👏</div>

            <div className="modal-actions">
              <IonButton onClick={restartGame}>Reiniciar o jogo</IonButton>
              <IonButton fill="outline" onClick={goToThemes}>
                Voltar para temas
              </IonButton>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PalavrasCruzadas;
