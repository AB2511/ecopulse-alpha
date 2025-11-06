<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🌿 EcoPulse α

**An AI-powered sustainability scanner to see any product's true eco-cost, built for the Google Cloud Run Hackathon.**

![Google Cloud Run Hackathon](https://img.shields.io/badge/Google%20Cloud%20Run-Hackathon%202025-blue?style=for-the-badge&logo=google-cloud)
![AI Studio Category](https://img.shields.io/badge/Category-AI%20Studio-green?style=for-the-badge&logo=google-ai)
![Deployed on Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-lightgrey?style=for-the-badge&logo=google-cloud)

---

## 🚀 Live Demo & Submission Links

| Link | URL |
|------|-----|
| 🌐 **Try It Out Live** | [https://ecopulse-1005723035457.us-west1.run.app](https://ecopulse-1005723035457.us-west1.run.app) |
| 🎬 **Demo Video** | *Watch the 3-minute Demo on YouTube* | [Youtube](https://youtu.be/3DoJAjEMF_I)
| 🤖 **AI Studio Prompts** | *View the Prompts in Google AI Studio* |
| 📂 **Public Code Repo** | [https://github.com/AB2511/ecopulse-alpha](https://github.com/AB2511/ecopulse-alpha) |

---

## 💡 Introduction

In a world of complex supply chains and greenwashing, consumers lack a simple way to understand the true environmental impact of their purchases. Product labels are often confusing or misleading, making sustainable choices difficult and time-consuming.

**EcoPulse α** is the solution.  
It’s an intelligent, serverless web application that empowers consumers to make informed, eco-conscious decisions instantly.  
By simply scanning a product’s barcode, uploading a photo, or pasting a URL, users receive a detailed and actionable sustainability report — turning every shopping trip into an opportunity to support a healthier planet.

---

## ✨ Key Features

- **Multi-Modal Input:** Analyze products via image upload (drag & drop), product URL, or real-time barcode scanning.  
- **AI-Powered Eco-Score:** Get instant analysis from Google’s **Gemini API**, providing scores (0–100) for:
  - Carbon Footprint — impact of production and transport  
  - Recyclability — materials and packaging assessment  
  - Ethical Sourcing — materials and labor practices  
- **Quantifiable Impact:** See stats on CO₂, trees saved, and plastic bottles avoided per year by choosing better alternatives.  
- **Greener Alternatives:** Discover specific, readily available, and more sustainable product alternatives with estimated prices.  
- **PNG Eco-Badge Generator:** Create and download personalized *Eco-Badges* to share your sustainable choices.  
- **Eco-Tips Carousel:** Stay engaged with rotating environmental tips.  
- **PWA Ready:** Installable on any device for a native app-like experience, complete with camera access for seamless scanning.

---

## 🛠️ Tech Stack & Architecture

**EcoPulse α** is a modern, serverless application built entirely on the **Google Cloud ecosystem**, designed for global scale and rapid deployment.

| Area | Technology | Purpose |
|------|-------------|----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS | A responsive, modern, and type-safe UI |
| **Barcode Scanning** | QuaggaJS | Fast, reliable real-time barcode scanning in-browser |
| **Deployment** | Google Cloud Run | Fully managed, serverless container hosting |
| **Core AI Logic** | Google Gemini API (gemini-2.5-flash) | Nuanced product impact analysis from multi-modal inputs |
| **Prototyping** | Google AI Studio | Used to design and refine structured JSON prompts |

---

## 🤖 AI Studio Category: How We Used It

**EcoPulse α** was developed for the **AI Studio Category**. Google AI Studio was instrumental in prototyping and refining the core analysis engine.

### Key Uses

- **Prompt Engineering:**  
  Designed and tested prompts instructing Gemini to act as an environmental expert.  

- **Structured Output (JSON Schema):**  
  The *Schema* feature in AI Studio ensured predictable JSON outputs for eco_score, impact, and alternatives — enabling reliable frontend parsing.  

- **Rapid Iteration:**  
  AI Studio’s quick experimentation with models, prompts, and temperature helped balance accuracy and creativity.  

> The final, battle-tested prompts were integrated into `services/geminiService.ts`.

➡️ *View our development prompts in Google AI Studio.*

---

## 💻 Setup & Installation

Designed for seamless deployment using the **“Deploy to Run”** button in AI Studio or via the **Google Cloud CLI**.

### Prerequisites

- A Google Cloud Project with **Cloud Run API** enabled  
- An enabled **Gemini API key**

### Environment Variables

| Variable | Description |
|-----------|--------------|
| `API_KEY` | Your Google Gemini API Key |

---

### Deployment Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ecopulse-alpha
   cd ecopulse-alpha
   ````

2. **Build the container image**

   ```bash
   gcloud builds submit --tag gcr.io/your-project-id/ecopulse-alpha
   ```

3. **Deploy to Cloud Run**

   ```bash
   gcloud run deploy ecopulse-alpha \
     --image gcr.io/your-project-id/ecopulse-alpha \
     --platform managed \
     --region your-region \
     --set-env-vars="API_KEY=your_gemini_api_key" \
     --allow-unauthenticated
   ```

---

## 🏆 Why EcoPulse Deserves to Win

* **Technical Excellence:**
  Clean, efficient, and serverless architecture built on Cloud Run best practices.

* **Innovative Solution:**
  Moves beyond Q&A — delivers *structured, actionable* sustainability insights that can influence real behavior.

* **Impactful & Scalable:**
  Serverless design means effortless global reach and real-world environmental impact.

* **Exceptional Presentation:**
  Intuitive, responsive UI makes sustainability accessible and fun.

---

**Made with ❤️ by Anjali for the #CloudRunHackathon.**
