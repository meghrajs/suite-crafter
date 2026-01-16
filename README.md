# SuiteMate - Automation Framework Generator

![SuiteMate Banner](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200&h=400)

**SuiteMate** is a powerful web-based tool designed to help QA engineers and developers generate production-ready automation testing frameworks in seconds. Whether you need a UI testing suite with Playwright or an API testing framework with RestAssured, SuiteMate configures the entire folder structure, dependencies, and sample code for you.

## 🚀 Features

- **Multi-Framework Support**: Generate projects for popular tools like:
  - **UI**: Playwright, Cypress, Selenium WebDriver, WebdriverIO
  - **API**: RestAssured, Supertest, Axios
- **Language Options**: Support for TypeScript, JavaScript, Java, Python, and C#.
- **Customizable Architecture**:
  - Choose between Page Object Model (POM), Screenplay Pattern, or simple script styles.
  - Integration with reporting tools like Allure, Mochawesome, and ExtentReports.
- **Docker & CI/CD Ready**: improved support for generating Dockerfiles and CI pipeline configs (GitHub Actions, Jenkins, GitLab CI).
- **Live Preview**: See the folder structure update in real-time as you configure your options.

## 🛠️ Usage

This project is built as a static client-side application, making it incredibly easy to host and run.

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/suite-crafter.git
   cd suite-crafter
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 🏗️ Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **State Management**: React Query, React Context
- **Icons**: Lucide React

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
