import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
  IonIcon,
  IonModal,
  IonText,
  IonToast,
} from "@ionic/react";
import { useAuth } from "../Contexts/AuthContext";
import {
  getMemoryThemeById,
  TemaMemoria,
} from "../Services/MemoryThemeService";
import { criarPontuacao } from "../Services/PontuacaoService";
import logoWhite from "../Assets/logoReverseRedondaWhite.png";
import "./MemoryThemeGame.css";
import { heart, heartDislike, checkmarkCircle } from "ionicons/icons";

interface RouteParams {
  id: string;
}

type CardType = "image" | "text";

interface MemoryCard {
  key: string;
  pairId: string;
  type: CardType;
  content: string;
  flipped: boolean;
  matched: boolean;
  identification?: string;
}

function sanitizeUrl(url: string | null): string {
  if (!url) return "";
  return url.replace(/[`'"\s]+/g, (m) => (m.includes("http") ? m : "")).trim();
}

const MemoryThemeGame: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const location = useLocation();
  const { user } = useAuth();
  const [theme, setTheme] = useState<TemaMemoria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [lives, setLives] = useState<number>(10);
  const audioCtxRef = useRef<any>(null);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardText, setRewardText] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");
  const [salvandoPontuacao, setSalvandoPontuacao] = useState<boolean>(false);

  useEffect(() => {
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      console.log("[MemoryGame] loading theme id", id);
      const data = await getMemoryThemeById(parseInt(id));

      if (process.env.NODE_ENV !== "production") {
        console.log("[Memory] tema:", data);
      }

      setTheme(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const initialCards = useMemo(() => {
    if (!theme || !Array.isArray(theme.cartas)) return [] as MemoryCard[];
    const byId: Record<
      string,
      {
        hasImage: boolean;
        hasText: boolean;
        image?: string;
        text?: string;
        identification?: string;
      }
    > = {};
    theme.cartas.forEach((c) => {
      const pid = String(c.id);
      const link = sanitizeUrl(c.Link_imagem);
      const uploaded = c.Imagem?.url
        ? `${import.meta.env.VITE_API_URL}${c.Imagem.url}`
        : "";
      const img = link || uploaded;
      const txt = c.Frase ?? "";
      const ident = c.identificacao ?? ""; // Captura a identificação

      const entry = byId[pid] ?? { hasImage: false, hasText: false };
      if (img) {
        entry.hasImage = true;
        entry.image = img;
      }
      if (txt) {
        entry.hasText = true;
        entry.text = txt;
      }
      if (ident) {
        entry.identification = ident;
      }
      byId[pid] = entry;
    });

    // 1. Collect valid pair data
    const validPairs: {
      pid: string;
      image: string;
      text: string;
      identification?: string;
    }[] = [];
    Object.keys(byId).forEach((pid) => {
      const e = byId[pid];
      if (e.hasImage && e.hasText && e.image && e.text) {
        validPairs.push({
          pid,
          image: e.image,
          text: e.text,
          identification: e.identification,
        });
      }
    });

    // 2. Shuffle valid pairs to pick random ones if we have more than 12
    for (let i = validPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = validPairs[i];
      validPairs[i] = validPairs[j];
      validPairs[j] = tmp;
    }

    // 3. Select up to 12 pairs (24 cards total)
    const selectedPairs = validPairs.slice(0, 12);

    // 4. Generate card objects
    const finalCards: MemoryCard[] = [];
    selectedPairs.forEach((p) => {
      finalCards.push({
        key: `${p.pid}-img`,
        pairId: p.pid,
        type: "image",
        content: p.image,
        flipped: false,
        matched: false,
        identification: p.identification,
      });
      finalCards.push({
        key: `${p.pid}-txt`,
        pairId: p.pid,
        type: "text",
        content: p.text,
        flipped: false,
        matched: false,
        identification: p.identification,
      });
    });

    // 5. Shuffle the final set of cards
    for (let i = finalCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = finalCards[i];
      finalCards[i] = finalCards[j];
      finalCards[j] = tmp;
    }
    return finalCards;
  }, [theme]);

  useEffect(() => {
    setCards(initialCards);
    console.log("[MemoryGame] built cards", initialCards);
    setOpenKeys([]);
    setMoves(0);
    setLives(10);
  }, [initialCards]);

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
  ) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
    }, duration);
  };

  const salvarPontuacaoNoBackend = async () => {
    if (!user?.id || !theme) return;

    setSalvandoPontuacao(true);
    try {
      const totalPares = cards.length / 2;
      const paresCertos = cards.filter((c) => c.matched).length / 2;

      const resultado = await criarPontuacao({
        jogo: "memoria" as const,
        acertos: paresCertos,
        totalPerguntas: totalPares,
        users_permissions_user: user.id,
        itemTitle: theme.Nome_tema,
      });

      if (resultado.sucesso) {
        setToastMessage(
          `✅ Pontuação salva: ${resultado.pontuacao?.total} pontos!`,
        );
        setToastColor("success");
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

  const handleFlip = (key: string) => {
    console.log("[MemoryGame] flip", key);
    setCards((prev) => {
      if (lives <= 0) return prev;
      const target = prev.find((c) => c.key === key);
      if (!target || target.flipped || target.matched) return prev;
      const flippedCount = prev.filter((c) => c.flipped && !c.matched).length;
      if (flippedCount >= 2) return prev;
      const next = prev.map((c) =>
        c.key === key ? { ...c, flipped: true } : c,
      );
      const open = [...openKeys, key];
      setOpenKeys(open);
      if (open.length === 2) {
        setMoves((m) => m + 1);
        const [k1, k2] = open;
        const c1 = next.find((c) => c.key === k1);
        const c2 = next.find((c) => c.key === k2);
        const isMatch =
          !!c1 && !!c2 && c1.pairId === c2.pairId && c1.type !== c2.type;
        console.log("[MemoryGame] compare", { k1, k2, isMatch, c1, c2 });
        if (isMatch) {
          playTone(880, 180, "sine");
          setTimeout(() => {
            setCards((curr) =>
              curr.map((c) =>
                c.key === k1 || c.key === k2 ? { ...c, matched: true } : c,
              ),
            );
            setOpenKeys([]);

            if (c1 && c1.identification) {
              setRewardText(c1.identification);
              setShowRewardModal(true);
            }
          }, 300);
        } else {
          playTone(260, 220, "sawtooth");
          setTimeout(() => {
            setCards((curr) =>
              curr.map((c) =>
                c.key === k1 || c.key === k2 ? { ...c, flipped: false } : c,
              ),
            );
            setOpenKeys([]);
            setLives((l) => Math.max(0, l - 1));
          }, 800);
        }
      }
      return next;
    });
  };

  const allMatched = cards.length > 0 && cards.every((c) => c.matched);
  const noPairs = !loading && theme && cards.length === 0;
  const gameOver = lives <= 0;

  const restartGame = () => {
    const base = initialCards.map((c) => ({
      ...c,
      flipped: false,
      matched: false,
    }));
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = base[i];
      base[i] = base[j];
      base[j] = tmp;
    }
    setCards(base);
    setOpenKeys([]);
    setMoves(0);
    setLives(10);
    setShowEndModal(false);
  };

  useEffect(() => {
    if ((allMatched || gameOver) && cards.length > 0 && !showRewardModal) {
      setShowEndModal(true);
      salvarPontuacaoNoBackend();
    }
  }, [allMatched, gameOver, cards.length, showRewardModal]);

  const searchParams = new URLSearchParams(location.search);
  const fromManagement = searchParams.get("from") === "management";

  const goToThemes = () => {
    setShowEndModal(false);
    restartGame();
    if (fromManagement) {
      history.replace("/tabs/card-management");
    } else {
      // Usamos replace aqui para que o jogo não fique no histórico
      // Assim, ao apertar 'Voltar' na lista de temas, o usuário vai para a tela de minigames
      history.replace("/tabs/games/memory");
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/games/memory" />
            </IonButtons>
            <IonTitle className="title-centered">Carregando tema</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Carregando cartas...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!theme) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="header-gradient">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/games/memory" />
            </IonButtons>
            <IonTitle className="title-centered">Tema não encontrado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <p>Não foi possível encontrar o tema solicitado.</p>
            <IonButton routerLink="/tabs/games/memory">Voltar</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="header-gradient">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/games/memory" />
          </IonButtons>
          <IonTitle className="title-centered">{theme.Nome_tema}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="memory-status">
          <span>Jogadas: {moves}</span>
          <span className="lives">
            <IonIcon className="heart" icon={heart} /> {lives}
          </span>
          {allMatched && <span className="done">Concluído</span>}
          {gameOver && <span>Sem vidas</span>}
        </div>

        <IonModal
          isOpen={showRewardModal}
          className="end-modal"
          backdropDismiss={false}
        >
          <div className="modal-box">
            <div className="modal-title">Você acertou!</div>
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
            <div
              className="modal-message"
              style={{
                fontSize: "1.2rem",
                fontWeight: "500",
                padding: "0 10px",
              }}
            >
              {rewardText}
            </div>
            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <IonButton
                expand="block"
                onClick={() => setShowRewardModal(false)}
              >
                Continuar
              </IonButton>
            </div>
          </div>
        </IonModal>

        <IonModal
          isOpen={showEndModal}
          className="end-modal"
          backdropDismiss={false}
        >
          <div className="modal-box">
            <div className="modal-title">Jogo finalizado</div>
            {gameOver ? (
              <>
                <div className="modal-message">Ops, acabou suas chances</div>
                <IonIcon className="modal-icon fail" icon={heartDislike} />
              </>
            ) : (
              <>
                <div className="modal-message">
                  Que legal! Você chegou até o final
                </div>
                <div className="applause">👏👏👏</div>
              </>
            )}
            <div className="modal-actions">
              <IonButton onClick={restartGame}>Reiniciar o jogo</IonButton>
              <IonButton fill="outline" onClick={goToThemes}>
                Voltar para temas
              </IonButton>
            </div>
          </div>
        </IonModal>
        {noPairs && (
          <div className="no-quizzes" style={{ padding: 16 }}>
            <p>Nenhum par válido encontrado para este tema.</p>
            <p>Para formar um par, é necessário:</p>
            <ul>
              <li>Uma carta com imagem e outra com frase</li>
              <li>Ambas estarem cadastradas no mesmo registro (ID)</li>
            </ul>
          </div>
        )}
        <div className="memory-grid">
          {cards.map((c) => (
            <div
              key={c.key}
              className={`memory-card ${
                c.flipped || c.matched ? "flipped" : ""
              } ${c.matched ? "matched" : ""}`}
              onClick={() => handleFlip(c.key)}
            >
              <div className="card-inner">
                <div className="card-face card-front">
                  {c.type === "image" ? (
                    <img className="image" src={c.content} alt="Carta" />
                  ) : (
                    <div className="phrase">{c.content}</div>
                  )}
                </div>
                <div className="card-face card-back">
                  <img
                    className="back-logo"
                    src={logoWhite}
                    alt="Conecta Elas"
                  />
                  <div className="back-title">Conecta Elas</div>
                </div>
              </div>
            </div>
          ))}
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

export default MemoryThemeGame;
