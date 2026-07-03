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

import { useNavigate } from "react-router-dom";
import { register } from "../../services/authService";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    try {

      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });

      alert("Usuário criado com sucesso!");

      navigate("/login");

    } catch {

      alert("Erro ao criar usuário.");

    }

  }

  return (

    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >

      <Card sx={{ width: "100%" }}>

        <CardContent>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
          >
            Criar Conta
          </Typography>

          <form onSubmit={handleSubmit}>

            <Stack spacing={2}>

              <TextField
                label="Nome"
                value={form.first_name}
                onChange={(e)=>
                  setForm({...form,first_name:e.target.value})
                }
              />

              <TextField
                label="Sobrenome"
                value={form.last_name}
                onChange={(e)=>
                  setForm({...form,last_name:e.target.value})
                }
              />

              <TextField
                label="Usuário"
                value={form.username}
                onChange={(e)=>
                  setForm({...form,username:e.target.value})
                }
              />

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e)=>
                  setForm({...form,email:e.target.value})
                }
              />

              <TextField
                label="Senha"
                type="password"
                value={form.password}
                onChange={(e)=>
                  setForm({...form,password:e.target.value})
                }
              />

              <TextField
                label="Confirmar Senha"
                type="password"
                value={form.confirmPassword}
                onChange={(e)=>
                  setForm({...form,confirmPassword:e.target.value})
                }
              />

              <Button
                type="submit"
                variant="contained"
              >
                Cadastrar
              </Button>

              <Button
                onClick={() => navigate("/login")}
              >
                Já tenho conta
              </Button>

            </Stack>

          </form>

        </CardContent>

      </Card>

    </Container>

  );

}