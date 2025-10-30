# 🚌 Patricio Turismo  

---

## 📄 Sobre o Projeto  
**Patricio Turismo** é uma plataforma web voltada para o gerenciamento e experiência de viagens rodoviárias interestaduais.  
Inspirada na trajetória real da empresa homônima, o projeto reflete **acolhimento, segurança e eficiência**, oferecendo uma solução digital moderna para clientes e administradores.  

A aplicação une **React + Vite** no frontend com uma API **Spring Boot** robusta, trazendo autenticação com **Spring Security e OAuth 2.0** e versionamento de banco via **Flyway**.  
Tudo foi estruturado com foco em **escalabilidade, modularidade e experiência do usuário**.

---

## 🎯 O Propósito  

- **Modernizar a experiência do cliente**, tornando as viagens mais acessíveis e organizadas.  
- **Centralizar o gerenciamento de rotas, reservas e passageiros**.  
- **Representar digitalmente os valores da marca Patricio Turismo**, unindo tecnologia e acolhimento.  

---

## ✨ Funcionalidades  

- **🔐 Autenticação segura** (Spring Security + OAuth 2.0)  
- **📋 Cadastro e gerenciamento de viagens**  
- **🚌 Visualização de rotas e destinos disponíveis**  
- **👥 Painel administrativo para gestão interna**  
- **💾 Versionamento de banco com Flyway**  
- **⚙️ Execução containerizada via Docker**  

---

## 💻 Telas da Aplicação  
| ![Tela Inicial](./screenshots/home.png) | ![Tela de Login](./screenshots/login.png) |  
|-----------------------------------------|-------------------------------------------|  
| <p align="center">🏠 Página Inicial</p> | <p align="center">🔐 Login</p> |  

| ![Painel de Viagens](./screenshots/dashboard.png) | ![Página de Detalhes](./screenshots/details.png) |  
|-----------------------------------------|---------------------------------------------|  
| <p align="center">🧭 Painel de Viagens</p> | <p align="center">🚌 Detalhes da Viagem</p> |

---

## 🛠️ Tecnologias Utilizadas  
<div style="display: inline_block">
  <a href="#"><img alt="react" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /></a>
  <a href="#"><img alt="vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" /></a>
  <a href="#"><img alt="spring" src="https://img.shields.io/badge/Spring Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" /></a>
  <a href="#"><img alt="java" src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" /></a>
  <a href="#"><img alt="postgresql" src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /></a>
  <a href="#"><img alt="docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /></a>
  <a href="#"><img alt="git" src="https://img.shields.io/badge/GIT-E44C30?style=for-the-badge&logo=git&logoColor=white"></a>
  <a href="#"><img alt="github" src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a>
</div>  

---

## 🧩 Arquitetura do Projeto  
```bash
Patricio-Turismo/
│
├── backend/ # API Spring Boot
│ ├── src/
│ ├── pom.xml
│ └── Dockerfile
│
├── frontend/ # Interface React + Vite
│ ├── src/
│ ├── package.json
│ └── vite.config.js
│
├── docker-compose.yml # Orquestração dos containers
└── README.md
```

---

## ⚙️ Executando o Projeto  

### 🔧 Pré-requisitos
- Node.js 18+  
- Java 17+  
- Docker (opcional)  

---

### ▶️ Frontend
```bash
cd frontend
npm install
npm run dev
Acesse em:
👉 http://localhost:5173
```

### ⚙️ Backend
```bash
cd backend
./mvn spring-boot:run
Acesse em:
👉 http://localhost:8080
```
### 🐳 Docker
```bash
docker-compose up --build
```
---

🧠 Flyway - Controle de Migrações

O banco de dados é versionado com Flyway Core, garantindo consistência entre ambientes e rastreabilidade de alterações de schema.
Cada nova versão do banco é automaticamente migrada no startup da aplicação.

---

🧭 Futuras Implementações

 Painel administrativo completo

 Histórico de viagens

 Aplicativo mobile com React Native

 ---

🧱 História do Projeto

O Patricio Turismo nasceu como um projeto autoral com o objetivo de digitalizar a operação de uma empresa real de transporte rodoviário.
Desde o design da marca até o deploy final em ambiente Docker, cada etapa foi planejada para unir tecnologia moderna, boas práticas de engenharia e a identidade acolhedora da empresa.

O desenvolvimento foi dividido em fases:

Design da marca e identidade visual – criação do logotipo com o “P fita” em laranja.

Desenvolvimento do Frontend – React + Vite para velocidade e interatividade.

Implementação do Backend – API REST segura com Spring Boot e OAuth 2.0.

Integração e Deploy – estruturação em containers Docker e versionamento no GitHub.

👨‍💻 Autor
<table> <tr> <td align="center" width="200"><a href="https://github.com/pedro-iago"><img src="https://avatars.githubusercontent.com/u/151461327?v=4" width="120" alt="GitHub Profile picture"/><br><sub><b>Pedro Iago Ribeiro</b></sub></a><br>Desenvolvedor Full Stack</td> </tr> </table>

📍 Brasil
🎓 Estudante de Análise e Desenvolvimento de Sistemas
💬 Interesses: Java, React, Docker, APIs REST, Arquitetura de Software

