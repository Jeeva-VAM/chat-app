import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Logging you in...</div>;
}

export default OAuthSuccess;