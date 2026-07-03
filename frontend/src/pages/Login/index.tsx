import { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

import { login } from "../../services/authService";

import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {

    e.preventDefault();

    try {

      setLoading(true);

      const response = await login(username, password);

      localStorage.setItem("token", response.access);

      localStorage.setItem("refresh", response.refresh);

      navigate("/");

    } catch {

      alert("Usuário ou senha inválidos.");

    } finally {

      setLoading(false);

    }

  }

  return (

    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        height: "100vh",
      }}
    >

      <Card sx={{ width: "100%" }}>

        <CardContent>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
          >
            Clínica System
          </Typography>

          <form onSubmit={handleLogin}>

            <Stack spacing={2}>

              <TextField
                label="Usuário"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                fullWidth
              />

              <TextField
                label="Senha"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                Entrar
              </Button>

              <Button
                onClick={() => navigate("/register")}
              >
                Criar Conta
              </Button>

            </Stack>

          </form>

        </CardContent>

      </Card>

    </Container>

  );

}