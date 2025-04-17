import { useState, useEffect, useCallback } from 'react';
import WebFont from 'webfontloader';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { fonts } from './fonts';
import './index.css';

function App() {
  const [template, setTemplate] = useState(null);
  const [names, setNames] = useState([]);
  const [currentName, setCurrentName] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [textColor, setTextColor] = useState('#000000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    WebFont.load({
      google: {
        families: fonts
      }
    });
  }, []);

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setTemplate(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const names = data.flat().filter(name => name);
        setNames(names);
        if (names.length > 0) setCurrentName(names[0]);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const generateCertificate = async (name) => {
    const certificate = document.getElementById('certificate-container');
    const canvas = await html2canvas(certificate, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    saveAs(blob, `certificate-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`);
  };

  const generateAllCertificates = async () => {
    setIsGenerating(true);
    setProgress(0);
    try {
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        setCurrentName(name);
        await new Promise(resolve => setTimeout(resolve, 300));
        await generateCertificate(name);
        setProgress(((i + 1) / names.length) * 100);
      }
      alert('All certificates have been generated successfully!');
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('There was an error generating the certificates. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">🎓 Certificate Generator</h1>
      <div className="main-content">
        <div className="preview-section">
          <div
            id="certificate-container"
            className="certificate-preview"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {template ? (
              <img src={template} alt="Certificate Template" className="template-image" />
            ) : (
              <div className="template-placeholder">Upload a template to start</div>
            )}
            {template && (
              <div
                className="draggable-text"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  fontSize: `${fontSize}px`,
                  fontFamily: selectedFont,
                  color: textColor,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
              >
                {currentName || 'Enter a name'}
              </div>
            )}
          </div>
        </div>

        <div className="controls-container">
          <div className="upload-section">
            <div className="control-group">
              <label>Template Image</label>
              <input type="file" accept="image/*" onChange={handleTemplateUpload} className="file-input" />
            </div>

            <div className="control-group">
              <label>Excel File (Names)</label>
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="file-input" />
            </div>
          </div>

          <div className="styling-section">
            <div className="control-group">
              <label>Name Preview</label>
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="text-input"
                placeholder="Enter name"
              />
            </div>

            <div className="control-group half">
              <label>Font</label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="select-input"
              >
                {fonts.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                ))}
              </select>
            </div>

            <div className="control-group half">
              <label>Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="color-input"
              />
            </div>

            <div className="control-group">
              <label>Font Size: {fontSize}px</label>
              <input
                type="range"
                min="12"
                max="100"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="range-input"
              />
            </div>
          </div>

          <div className="actions-section">
            <button
              className="button primary"
              onClick={() => generateCertificate(currentName)}
              disabled={!template || isGenerating}
            >
              Generate Current
            </button>
            <button
              className="button secondary"
              onClick={generateAllCertificates}
              disabled={!template || isGenerating || names.length === 0}
            >
              Generate All ({names.length})
            </button>
          </div>

          {isGenerating && (
            <div className="progress-container">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">Generating: {Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;