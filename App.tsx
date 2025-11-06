// Fix: Implement the main App component to provide the application's UI and logic.
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { getEcoScoreFromImage, getEcoScoreFromUrl } from './services/geminiService';
import type { EcoScoreResponse } from './types';
import { ScoreBar } from './components/ScoreBar';
import { UploadIcon, CameraIcon, LinkIcon } from './components/Icons';
import { BarcodeScanner } from './components/BarcodeScanner';

const ECO_TIPS = [
  "Use reusable bags for shopping to reduce plastic waste.",
  "Switch to LED light bulbs to save energy and lower your electricity bill.",
  "Opt for products with minimal or recycled packaging.",
  "Compost food scraps to reduce landfill methane emissions."
];

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [ecoScoreResponse, setEcoScoreResponse] = useState<EcoScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTipIndex((prevIndex) => (prevIndex + 1) % ECO_TIPS.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(intervalId);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageAnalysis = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setError(null);
    setEcoScoreResponse(null);
    setImage(URL.createObjectURL(file));
    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await getEcoScoreFromImage(base64, file.type, barcode || undefined);
      setEcoScoreResponse(response);
      if (response.barcode_detected && !barcode) {
        setBarcode(response.barcode_detected);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlAnalysis = async () => {
    if (!urlInput.trim() || !urlInput.startsWith('http')) {
        setError('Please enter a valid product URL.');
        return;
    }
    setError(null);
    setEcoScoreResponse(null);
    setImage(null);
    setIsLoading(true);
    try {
        const response = await getEcoScoreFromUrl(urlInput);
        setEcoScoreResponse(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageAnalysis(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageAnalysis(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBarcodeDetect = async (detectedBarcode: string) => {
    setIsScanning(false);
    setEcoScoreResponse(null);
    setError(null);
    setImage(null);
    setIsLoading(true);
    setBarcode(detectedBarcode);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const ecoScoreResponseSchema = {
        type: Type.OBJECT,
        properties: {
          eco_score: {
            type: Type.OBJECT,
            properties: {
              carbon: { type: Type.NUMBER },
              recyclability: { type: Type.NUMBER },
              sourcing: { type: Type.NUMBER },
            },
            required: ["carbon", "recyclability", "sourcing"],
          },
          analysis: { type: Type.STRING },
          impact: {
            type: Type.OBJECT,
            properties: {
              co2_per_year_kg: { type: Type.NUMBER },
              trees_saved_per_year: { type: Type.NUMBER },
              plastic_bottles_avoided: { type: Type.NUMBER },
            },
            required: ["co2_per_year_kg", "trees_saved_per_year", "plastic_bottles_avoided"],
          },
          alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
          barcode_detected: { type: Type.STRING },
        },
        required: ["eco_score", "analysis", "impact", "alternatives"],
      };

      const model = 'gemini-2.5-flash';
      
      const prompt = `Analyze the product identified by this barcode: ${detectedBarcode}. 
      Act as an environmental expert. Your analysis should be critical and informative. Provide scores from 0-100 for carbon footprint (production and transport), recyclability (packaging and product), and ethical sourcing (materials and labor). 
      Also, provide a brief analysis paragraph, quantifiable positive environmental impact statistics (like CO2, trees saved, plastic bottles avoided per year by switching to a better alternative), and suggest 2-3 specific, readily available, more sustainable alternative products, including an estimated price range (e.g., "$15-25").
      Return the result in JSON format that adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: ecoScoreResponseSchema,
          temperature: 0.2,
        },
      });

      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString) as EcoScoreResponse;
      setEcoScoreResponse(result);

    } catch (err) {
      if (err instanceof Error) {
          if (err.message.includes('API_KEY')) {
                 setError("Invalid or missing API Key. Please ensure your API_KEY is correctly configured.");
            } else if (err.message.includes('JSON')) {
                 setError("The model returned an invalid response. Please try again.");
             } else {
                setError(err.message);
             }
      } else {
        setError('An unknown error occurred during barcode analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const generateAndDownloadBadge = () => {
    const nameInput = document.getElementById('badgeName') as HTMLInputElement;
    const levelSelect = document.getElementById('badgeLevel') as HTMLSelectElement;
    const name = nameInput?.value || 'Eco Hero';
    const level = levelSelect?.value || 'A+';
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ECFDF5');
    gradient.addColorStop(1, '#D1FAE5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(75, 110);
    ctx.bezierCurveTo(20, 80, 60, 20, 75, 40);
    ctx.bezierCurveTo(90, 20, 130, 80, 75, 110);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(name, 140, 60);

    ctx.fillStyle = '#047857';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(`Eco Level: ${level}`, 140, 95);

    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecopulse-badge-${name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const renderResults = () => {
    if (!ecoScoreResponse) return null;

    const { eco_score, analysis, impact, alternatives, barcode_detected } = ecoScoreResponse;
    const overallScore = (eco_score.carbon + eco_score.recyclability + eco_score.sourcing) / 3;

    const getScoreColor = (score: number) => {
        if (score > 70) return 'bg-green-500';
        if (score > 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };
    
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Eco-Score Analysis</h2>
        
        {image && <img src={image} alt="Product" className="max-h-64 rounded-lg mx-auto mb-6 shadow-md"/>}

        <div className="text-center mb-8">
          <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center text-white font-extrabold text-4xl ${getScoreColor(overallScore)} border-4 border-white shadow-lg`}>
              {Math.round(overallScore)}
          </div>
          <p className="text-gray-600 mt-2 font-semibold">Overall Score</p>
        </div>
        
        {(barcode_detected || barcode) && <p className="text-center text-sm text-gray-500 mb-4">Barcode: {barcode_detected || barcode}</p>}
        
        <div className="space-y-6 mb-8">
          <ScoreBar label="Carbon Footprint" value={eco_score.carbon} color={getScoreColor(eco_score.carbon)} description="Low carbon impact" />
          <ScoreBar label="Recyclability" value={eco_score.recyclability} color={getScoreColor(eco_score.recyclability)} description="Highly recyclable" />
          <ScoreBar label="Ethical Sourcing" value={eco_score.sourcing} color={getScoreColor(eco_score.sourcing)} description="Sustainably sourced" />
        </div>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Expert Analysis</h3>
          <p className="text-gray-700 leading-relaxed">{analysis}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
          <div>
            <p className="text-3xl font-bold text-green-600">{impact.co2_per_year_kg.toFixed(1)} kg</p>
            <p className="text-sm text-gray-600">CO₂ saved/year</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{impact.trees_saved_per_year.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Trees saved/year</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{impact.plastic_bottles_avoided}</p>
            <p className="text-sm text-gray-600">Plastic bottles avoided</p>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Sustainable Alternatives</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {alternatives.map((alt, index) => <li key={index}>{alt}</li>)}
          </ul>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Generate Your Eco-Badge!</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <input id="badgeName" type="text" placeholder="Your Name (e.g., Alex)" className="w-full sm:w-auto px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                <select id="badgeLevel" className="w-full sm:w-auto px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    <option>A+ (Eco-Champion)</option>
                    <option>A (Eco-Advocate)</option>
                    <option>B (Eco-Conscious)</option>
                    <option>C (Eco-Aware)</option>
                </select>
                <button 
                    onClick={generateAndDownloadBadge}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition-all"
                >
                    Download PNG
                </button>
            </div>
        </div>

      </div>
    );
  };

  const renderInitialState = () => (
     <div className="w-full max-w-2xl mx-auto text-center">
        <div 
          onDrop={handleDrop} 
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-gray-300 rounded-2xl p-12 cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-all duration-300"
        >
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            ref={fileInputRef} 
          />
          <UploadIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-xl font-semibold text-gray-700">Click or drag & drop an image</p>
          <p className="mt-1 text-sm text-gray-500">Analyze a product to get its eco-score.</p>
        </div>

        <div className="mt-4 flex gap-2">
            <input 
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste a product URL"
                className="flex-grow px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
                onClick={handleUrlAnalysis}
                disabled={isLoading}
                className="inline-flex items-center justify-center p-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
                <LinkIcon className="h-6 w-6"/>
            </button>
        </div>

        <div className="mt-6 flex justify-center items-center">
            <span className="h-px w-20 bg-gray-300"></span>
            <span className="mx-4 text-gray-500 font-medium">OR</span>
            <span className="h-px w-20 bg-gray-300"></span>
        </div>
        <button 
            onClick={() => setIsScanning(true)}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
            <CameraIcon className="h-6 w-6 mr-3" />
            Scan Barcode
        </button>
        {barcode && !ecoScoreResponse && <p className="mt-4 text-gray-600">Scanned barcode: <strong>{barcode}</strong>. Upload an image to add context.</p>}
    </div>
  );
  
  const resetState = () => {
    setImage(null);
    setEcoScoreResponse(null);
    setBarcode('');
    setUrlInput('');
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 tracking-tight">
            EcoPulse <span className="text-green-500">α</span>
        </h1>
        <p className="mt-2 text-lg text-gray-600">Your AI-powered sustainability assistant.</p>
      </header>
      <main className="w-full">
        {isScanning && <BarcodeScanner onDetect={handleBarcodeDetect} onClose={() => setIsScanning(false)} />}
        {error && <div className="w-full max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
        </div>}

        {isLoading ? (
          <div className="text-center">
            {image && <img src={image} alt="Product being analyzed" className="max-h-64 rounded-lg mx-auto mb-6 shadow-md"/>}
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700">Analyzing your product...</p>
            <p className="text-sm text-gray-500">This might take a moment.</p>
          </div>
        ) : (
            ecoScoreResponse ? renderResults() : renderInitialState()
        )}
        {
          (ecoScoreResponse || error) && !isLoading && (
            <div className="mt-8 text-center">
                <button 
                    onClick={resetState}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    Analyze Another Product
                </button>
            </div>
          )
        }
      </main>

       <section className="w-full max-w-2xl mx-auto mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Eco Tips to Save the Planet</h2>
        <div className="bg-white rounded-lg p-6 shadow-md min-h-[80px] flex items-center justify-center">
            <p className="text-lg text-gray-700 italic">"{ECO_TIPS[tipIndex]}"</p>
        </div>
      </section>

      <footer className="mt-12 text-center text-sm text-gray-500 space-y-1">
        <p>Made with ❤️ by Anjali using AI Studio</p>
        <p>Powered by Gemini & Google Cloud Run</p>
        <p>🌏 CloudRunHackathon</p>
      </footer>
    </div>
  );
};

export default App;