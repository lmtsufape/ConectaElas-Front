import React, { useState } from "react";
import { IonIcon } from "@ionic/react";
import { arrowBack, eye, eyeOff } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { LoginScreens } from "../pages/Login";
import "./RenderRegisterComponent.css";

interface RenderRegisterComponentProps {
  handleChangeScreen: (screen: LoginScreens) => void;
}

const RenderRegisterComponent: React.FC<RenderRegisterComponentProps> = ({
  handleChangeScreen,
}) => {
  const { register } = useAuth();
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      handleChangeScreen(LoginScreens.LOGIN);
    } else {
      setError("Erro ao cadastrar usuário. Tente novamente.");
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="top-box">
        <div
          className="back-button"
          onClick={() => handleChangeScreen(LoginScreens.LOGIN)}
        >
          <IonIcon icon={arrowBack} />
        </div>
      </div>
      <div className="register-box">
        <h2 className="login-title">Criando uma conta</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="username">Como você prefere ser chamada?</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="password-label-box">
              <label htmlFor="password" className="label-password">
                Qual a senha que você deseja utilizar no aplicativo?
              </label>
              <p>para sua segurança evite usar uma senha que você já utiliza</p>
            </div>

            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <IonIcon
                icon={showPassword ? eyeOff : eye}
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-icon"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Digite a senha novamente</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <IonIcon
                icon={showConfirmPassword ? eyeOff : eye}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="toggle-password-icon"
              />
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
      </div>
      <div style={{ width: "44px" }} />
    </div>
  );
};

export default RenderRegisterComponent;
