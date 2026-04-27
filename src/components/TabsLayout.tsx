import React, { Suspense, useTransition } from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonSpinner,
} from "@ionic/react";
import {
  Redirect,
  Route,
  RouteComponentProps,
  useLocation,
} from "react-router-dom";
import {
  homeSharp,
  informationCircleSharp,
  gameControllerSharp,
} from "ionicons/icons";

import Tab1 from "../pages/Tab1";
import Tab2 from "../pages/Tab2";
import Tab3 from "../pages/Tab3";
import UserChat from "../pages/UserChat";
import ReportChannels from "../pages/ReportChannels";
import AngelContact from "../pages/AngelContact";
import Sobre from "../pages/Sobre";

import QuizList from "../pages/QuizList";
import QuizDetail from "../pages/QuizDetail";
import QuizManagement from "../pages/QuizManagement";
import Games from "../pages/Games";

import MemoryThemeList from "../pages/MemoryThemeList";
import MemoryThemeGame from "../pages/MemoryThemeGame";
import PrivateRoute from "./PrivateRoute";
import CacaPalavras from "../pages/CacaPalavras";
import CacaPalavrasList from "../pages/CacaPalavrasList";
import TestLocalStorage from "../pages/TestLocalStorage";

import ManagementHub from "../pages/ManagementHub";
import CardManagement from "../pages/CardManagement";
import CacaPalavrasManagement from "../pages/CacaPalavrasManagement";
import PalavrasCruzadas from "../pages/PalavrasCruzadas";
import PalavrasCruzadasList from "../pages/PalavrasCruzadasList";
import PalavrasCruzadasManagement from "../pages/PalavrasCruzadasManagement";
import MinigamesProgress from "../pages/MinigamesProgress";

import AddBanner from "../pages/AddBanner";
import AddPost from "../pages/AddPost";

const QuizResult = React.lazy(() => import("../pages/QuizResult"));

const TabsLayout: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const location = useLocation();

  const path = location.pathname;
  let selectedTab: string = "";

  if (path === "/tabs/tab1") selectedTab = "tab1";
  else if (path === "/tabs/tab2") selectedTab = "tab2";
  else if (path === "/tabs/games") selectedTab = "games";
  else if (path === "/tabs/sobre") selectedTab = "sobre";
  else if (path === "/tabs/tab3") selectedTab = "tab3";

  const getTabStyle = (tabId: string) => ({
    "--color-selected":
      selectedTab === tabId ? "var(--cor-secundaria)" : "var(--cor-principal)",
    "--color":
      selectedTab === tabId ? "var(--cor-secundaria)" : "var(--cor-principal)",
    color:
      selectedTab === tabId ? "var(--cor-secundaria)" : "var(--cor-principal)",
  });

  return (
    <IonTabs>
      <IonRouterOutlet>
        <PrivateRoute exact path="/tabs/tab1" component={Tab1} />
        <PrivateRoute exact path="/tabs/tab2" component={Tab2} />
        <PrivateRoute exact path="/tabs/tab3" component={Tab3} />
        <PrivateRoute exact path="/tabs/chat" component={UserChat} />
        <PrivateRoute exact path="/tabs/management" component={ManagementHub} />
        <PrivateRoute
          exact
          path="/tabs/card-management"
          component={CardManagement}
        />
        <PrivateRoute
          exact
          path="/tabs/caca-palavras-management"
          component={CacaPalavrasManagement}
        />

        <Route exact path="/tabs/sobre" component={Sobre} />

        <PrivateRoute
          exact
          path="/tabs/ReportChannels"
          component={ReportChannels}
        />
        <PrivateRoute
          exact
          path="/tabs/AngelContact"
          component={AngelContact}
        />
        <PrivateRoute exact path="/tabs/add-banner" component={AddBanner} />
        <PrivateRoute exact path="/tabs/add-post" component={AddPost} />
        <PrivateRoute exact path="/tabs/quiz" component={QuizList} />
        <PrivateRoute
          exact
          path="/tabs/quiz-detail/:id"
          component={QuizDetail}
        />
        <PrivateRoute
          exact
          path="/tabs/quiz-management"
          component={QuizManagement}
        />

        <PrivateRoute exact path="/tabs/games" component={Games} />
        <PrivateRoute
          exact
          path="/tabs/games/memory"
          component={MemoryThemeList}
        />
        <PrivateRoute
          exact
          path="/tabs/games/memory/:id"
          component={MemoryThemeGame}
        />
        <PrivateRoute
          exact
          path="/tabs/games/caca-palavras"
          component={CacaPalavrasList}
        />
        <PrivateRoute
          exact
          path="/tabs/games/caca-palavras/:id"
          component={CacaPalavras}
        />
        <PrivateRoute
          exact
          path="/tabs/games/palavras-cruzadas"
          component={PalavrasCruzadasList}
        />
        <PrivateRoute
          exact
          path="/tabs/games/palavras-cruzadas/:id"
          component={PalavrasCruzadas}
        />
        <PrivateRoute
          exact
          path="/tabs/minigames-progress"
          component={MinigamesProgress}
        />

        {/* ROTA NOVA REGISTRADA AQUI: */}
        <PrivateRoute
          exact
          path="/tabs/palavras-cruzadas-management"
          component={PalavrasCruzadasManagement}
        />

        <PrivateRoute
          exact
          path="/tabs/quiz-result/:id"
          render={(props: RouteComponentProps) => (
            <Suspense
              fallback={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    flexDirection: "column",
                  }}
                >
                  <IonSpinner name="crescent" />
                  <p>Carregando resultado...</p>
                </div>
              }
            >
              <QuizResult />
            </Suspense>
          )}
        />

        <Route
          exact
          path="/tabs/test-localstorage"
          component={TestLocalStorage}
        />
        <Redirect exact from="/tabs" to="/tabs/tab1" />
      </IonRouterOutlet>

      <IonTabBar slot="bottom" selectedTab={selectedTab}>
        <IonTabButton tab="tab1" href="/tabs/tab1" style={getTabStyle("tab1")}>
          <IonIcon icon={homeSharp} />
          <IonLabel>Início</IonLabel>
        </IonTabButton>

        <IonTabButton tab="tab2" href="/tabs/tab2" style={getTabStyle("tab2")}>
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 24,
              WebkitMaskImage:
                "url(/social-network-icon-set-community-connection-vector-symbol-global-connect-sign-globle-networking-ico.svg)",
              maskImage:
                "url(/social-network-icon-set-community-connection-vector-symbol-global-connect-sign-globle-networking-ico.svg)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              backgroundColor: "currentColor",
            }}
          />
          <IonLabel>Conexões</IonLabel>
        </IonTabButton>

        <IonTabButton tab="games" href="/tabs/games" style={getTabStyle("games")}>
          <IonIcon icon={gameControllerSharp} />
          <IonLabel>Jogos</IonLabel>
        </IonTabButton>

        <IonTabButton tab="sobre" href="/tabs/sobre" style={getTabStyle("sobre")}>
          <IonIcon icon={informationCircleSharp} />
          <IonLabel>Sobre</IonLabel>
        </IonTabButton>

        <IonTabButton tab="tab3" href="/tabs/tab3" style={getTabStyle("tab3")}>
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 24,
              WebkitMaskImage: "url(/perfilMulher.svg)",
              maskImage: "url(/perfilMulher.svg)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              backgroundColor: "currentColor",
            }}
          />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default TabsLayout;
