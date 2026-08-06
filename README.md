# 🚀 ApiLens – AI-Powered API Testing Platform

> **ApiLens** is a modern, AI-powered API testing platform that helps developers design, test, debug, document, and manage APIs—all from the browser.

Unlike traditional API clients, ApiLens integrates AI to explain responses, debug errors, generate API requests, and assist developers throughout the API development lifecycle.

---

## ScreenShots

--<img width="1901" height="870" alt="image" src="https://github.com/user-attachments/assets/be25b6d9-d558-496d-8f1a-c6e1298c1c1a" />
--<img width="1914" height="867" alt="image" src="https://github.com/user-attachments/assets/8b49d09d-7106-4bee-a9ab-da00e07bd21a" />
--<img width="1913" height="864" alt="image" src="https://github.com/user-attachments/assets/3688ccd5-a14b-4203-8220-9e5561c843b1" />
--<img width="1908" height="860" alt="image" src="https://github.com/user-attachments/assets/dbeb3be0-9a6f-4780-895e-80ee95eb1831" />
--<img width="1914" height="955" alt="image" src="https://github.com/user-attachments/assets/f0c48a3f-44b8-44e9-be75-77e067742501" />


## ✨ Features

### 🔐 Authentication
- Email & Password Authentication
- Secure JWT Authentication
- Password Hashing
- Protected Routes
- User-specific Data

### 🌐 API Testing
- REST API Testing
- Support for GET, POST, PUT, PATCH, DELETE
- Custom Headers
- Query Parameters
- Request Body
- Response Viewer
- Status Code
- Response Time
- Response Headers

### 📚 Collections
- Create Collections
- Organize Requests
- Edit Requests
- Delete Requests
- Search Collections

### 📜 Request History
- Automatic Request History
- Search History
- Delete Individual Requests
- Clear All History

### 📊 Analytics Dashboard
- Total Requests
- Success vs Failed Requests
- Most Used HTTP Methods
- Response Time Analytics
- Activity Timeline
- API Usage Statistics

---

# 🤖 AI Assistant

ApiLens includes an integrated AI Assistant to help developers work faster.

### AI Features

✅ Explain API Responses

```text
Explain this JSON response.
```

---

✅ Debug API Errors

```text
Why am I getting a 401 Unauthorized?
```

AI explains

- Possible Cause
- Solution
- Best Practices

---

✅ Generate API Requests

Example

```text
Create a login API request.
```

Automatically generates

- Method
- URL
- Headers
- JSON Body

---

✅ Generate Documentation

Generate professional API documentation from existing requests.

---

✅ Generate Client Code

Supported Languages

- JavaScript Fetch
- Axios
- Python Requests
- cURL
- Node.js
- Java

---

✅ Improve Requests

AI suggests

- Missing Headers
- Better Payloads
- Security Improvements
- Authentication Issues

---

## 🏗 Tech Stack

### Frontend

- React
- TypeScript / JavaScript
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt
- REST APIs

### Database

- PostgreSQL / MongoDB *(depending on your setup)*

### AI

- OpenAI API *(or any LLM provider)*
- AI Context Builder
- Conversation Memory
- Prompt Engineering

---

# 📂 Project Structure

```
ApiLens/
│
├── client/
│
├── server/
│
├── routes/
│
├── controllers/
│
├── middleware/
│
├── services/
│   └── ai/
│       ├── chat_assistance.js
│       ├── aiProvider.js
│       ├── contextBuilder.js
│       ├── promptBuilder.js
│       └── conversationMemory.js
│
├── models/
│
├── config/
│
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/yourusername/apilens.git
```

```bash
cd apilens
```

---

## Install Dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

---

## Environment Variables

Create a `.env` file.

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=

OPENAI_API_KEY=
```

---

## Run Backend

```bash
npm run dev
```

---

## Run Frontend

```bash
npm run dev
```

---

# 🎯 Roadmap

- [x] API Testing
- [x] Collections
- [x] Request History
- [x] Authentication
- [x] Analytics Dashboard
- [x] AI Chat Assistant
- [ ] Import Postman Collections
- [ ] OpenAPI / Swagger Import
- [ ] Team Collaboration
- [ ] Mock Server
- [ ] AI Test Case Generation
- [ ] WebSocket Testing
- [ ] GraphQL Support
- [ ] API Monitoring

---

# 📸 Screenshots

> Add screenshots of your application here.

- Dashboard
- API Tester
- AI Assistant
- Collections
- Analytics

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 🌟 Why ApiLens?

Traditional API clients help you **send requests**.

ApiLens helps you **understand, debug, optimize, and build APIs with AI**.

It combines API testing, intelligent debugging, AI-powered documentation, request generation, and analytics into one seamless developer experience.

---

# 📄 License

MIT License

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and help support the project!
