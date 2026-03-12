import { useState, useRef, useEffect } from 'react'
import { Eraser, Pencil, Image as ImageIcon, Loader2, Download, Wand2, PaintBucket, Moon, Sun, Undo, Redo, Dices, RefreshCw, Layers, Cpu, Database, Github, Upload, Clock, Target } from 'lucide-react'

// --- THEME CONFIGURATION ---
const themes = {
  light: { bg: '#f3f4f6', panel: '#ffffff', text: '#1f2937', subText: '#6b7280', border: '#e5e7eb', accent: '#3b82f6', accentHover: '#2563eb', inputBg: '#f9fafb', canvasBorder: '#d1d5db', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', toolBg: '#f3f4f6', activeTool: '#eff6ff', footerBg: '#e5e7eb' },
  dark: { bg: '#111827', panel: '#1f2937', text: '#f9fafb', subText: '#9ca3af', border: '#374151', accent: '#6366f1', accentHover: '#4f46e5', inputBg: '#374151', canvasBorder: '#4b5563', shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)', toolBg: '#111827', activeTool: '#312e81', footerBg: '#0f172a' }
}

const RANDOM_PROMPTS = [
  "Cyberpunk street food vendor, neon lights, rain, highly detailed, 8k",
  "A tiny cute dragon sitting on a pile of gold coins, 3d render, blender style",
  "Origami paper art of a fox in a forest, soft lighting, depth of field",
  "Vaporwave statue head, glitch art, pink and purple aesthetics",
  "Steampunk mechanical owl, brass gears, steam, victorian style",
  "Isometric view of a cozy magic potion shop, cute, low poly"
]

function App() {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null) 
  const [isDarkMode, setIsDarkMode] = useState(true) 
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState('draw') 
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [history, setHistory] = useState([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)
  const [prompt, setPrompt] = useState("A cute futuristic robot, 4k, high quality")
  const [negPrompt, setNegPrompt] = useState("low quality, bad anatomy, blurry, pixelated, ugly")
  const [seed, setSeed] = useState("-1") 
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  // New State for Stats
  const [genStats, setGenStats] = useState(null)

  const theme = isDarkMode ? themes.dark : themes.light

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    saveHistory()
  }, [])

  const saveHistory = () => {
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(dataUrl)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1
      setHistoryStep(newStep)
      restoreCanvas(history[newStep])
    }
  }

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1
      setHistoryStep(newStep)
      restoreCanvas(history[newStep])
    }
  }

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = dataUrl
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
  }

  const processFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, 512, 512)
        saveHistory()
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e) => { processFile(e.target.files[0]); e.target.value = '' }
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file && file.type.startsWith('image/')) processFile(file) }

  const startDrawing = (e) => {
    if (mode === 'fill') {
      const { offsetX, offsetY } = e.nativeEvent
      floodFill(offsetX, offsetY, brushColor)
      saveHistory()
      return
    }
    const ctx = canvasRef.current.getContext('2d')
    const { offsetX, offsetY } = e.nativeEvent
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round' 
    ctx.lineJoin = 'round'
    ctx.strokeStyle = mode === 'erase' ? 'white' : brushColor
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
    ctx.lineTo(offsetX, offsetY) 
    ctx.stroke()
    setIsDrawing(true)
  }

  const draw = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    setCursorPos({ x: offsetX, y: offsetY })
    if (!isDrawing || mode === 'fill') return
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = mode === 'erase' ? 'white' : brushColor
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.closePath()
      setIsDrawing(false)
      saveHistory()
    }
  }

  const floodFill = (startX, startY, fillColor) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
    }
    const targetRgb = hexToRgb(fillColor)
    const pixelIndex = (startY * width + startX) * 4
    const startR = data[pixelIndex], startG = data[pixelIndex+1], startB = data[pixelIndex+2]
    if (startR === targetRgb.r && startG === targetRgb.g && startB === targetRgb.b) return
    const match = (idx) => data[idx] === startR && data[idx+1] === startG && data[idx+2] === startB
    const queue = [[startX, startY]]
    while (queue.length > 0) {
      const [x, y] = queue.pop()
      const idx = (y * width + x) * 4
      if (match(idx)) {
        data[idx] = targetRgb.r; data[idx+1] = targetRgb.g; data[idx+2] = targetRgb.b; data[idx+3] = 255
        if(x+1 < width) queue.push([x+1,y])
        if(x-1 >= 0) queue.push([x-1,y])
        if(y+1 < height) queue.push([x,y+1])
        if(y-1 >= 0) queue.push([x,y-1])
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveHistory()
  }

  const applyPreset = (styleName) => {
    const basePrompt = prompt.split(',')[0]
    switch(styleName) {
      case 'Cinematic': setPrompt(`${basePrompt}, cinematic lighting, dramatic, 8k, photorealistic, movie scene`); break
      case 'Anime': setPrompt(`${basePrompt}, anime style, studio ghibli, vibrant colors, cell shaded, highly detailed`); break
      case 'Oil Paint': setPrompt(`${basePrompt}, oil painting, thick brushstrokes, textured, masterpiece, artstation`); break
      case '3D': setPrompt(`${basePrompt}, 3d render, blender, unreal engine 5, raytracing, sharp focus`); break
      case 'Sketch': setPrompt(`${basePrompt}, pencil sketch, graphite, charcoal, rough lines, artistic`); break
    }
  }

  const surpriseMe = () => { setPrompt(RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)]) }

  const generateImage = async () => {
    setLoading(true)
    setGenStats(null) // Reset stats on new generation
    try {
      const canvas = canvasRef.current
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const formData = new FormData()
      formData.append('file', blob)
      formData.append('prompt', prompt)
      formData.append('negative_prompt', negPrompt)
      formData.append('steps', 20) 
      formData.append('seed', parseInt(seed) || -1)

      const response = await fetch('http://127.0.0.1:8000/api/generate', { method: 'POST', body: formData })
      
      if (!response.ok) {
        const errText = await response.text(); 
        throw new Error(`Server Error: ${response.status} ${errText.slice(0, 50)}...`)
      }
      
      const data = await response.json() 
      setResult(data.image)
      setSeed(data.seed)
      // Set the stats received from backend
      setGenStats({ time: data.time, accuracy: data.accuracy })
    } catch (err) { alert("Error: " + err.message) } finally { setLoading(false) }
  }

  const s = {
    wrapper: { minHeight: '100vh', width: '100%', backgroundColor: theme.bg, color: theme.text, transition: 'all 0.3s ease', fontFamily: "'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column' },
    nav: { padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.panel, position: 'sticky', top: 0, zIndex: 50 },
    logo: { fontSize: '20px', fontWeight: '800', color: theme.text },
    navBadge: { fontSize: '13px', background: theme.inputBg, padding: '4px 10px', borderRadius: '4px', marginLeft: '15px', color: theme.subText, border: `1px solid ${theme.border}`, fontWeight: '600' },
    workspace: { flex: 1, display: 'flex', gap: '30px', padding: '30px', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' },
    card: { backgroundColor: theme.panel, borderRadius: '12px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    toolbar: { display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: theme.toolBg, padding: '4px 8px', borderRadius: '8px', border: `1px solid ${theme.border}` },
    toolBtn: (active) => ({ padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: active ? theme.accent : 'transparent', color: active ? 'white' : theme.text, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    canvasWrapper: { position: 'relative', width: '512px', height: '512px', cursor: 'none', marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: isDragging ? `2px dashed ${theme.accent}` : `2px solid ${theme.canvasBorder}`, transition: 'border 0.2s ease' },
    dragOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(59, 130, 246, 0.2)', display: isDragging ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', zIndex: 50, color: theme.accent, fontWeight: 'bold', fontSize: '18px', pointerEvents: 'none' },
    cursor: { position: 'absolute', pointerEvents: 'none', top: 0, left: 0, width: `${brushSize}px`, height: `${brushSize}px`, border: '1px solid #000', backgroundColor: mode === 'erase' ? 'white' : brushColor, borderRadius: '50%', transform: `translate(${cursorPos.x - brushSize/2}px, ${cursorPos.y - brushSize/2}px)`, display: showCursor && !isDragging ? 'block' : 'none', zIndex: 10, boxShadow: '0 0 4px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    chipContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' },
    chip: { padding: '6px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.subText, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' },
    primaryBtn: { width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: theme.accent, color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.1s' },
    secondaryBtn: { padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
    iconBtn: { background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    resultBox: { width: '512px', height: '512px', backgroundColor: isDarkMode ? '#000' : '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme.border}` },
    footer: { width: '100%', backgroundColor: theme.footerBg, borderTop: `1px solid ${theme.border}`, padding: '40px 0', marginTop: 'auto' },
    footerContent: { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 30px', flexWrap: 'wrap', gap: '30px' },
    footerCol: { display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' },
    footerTitle: { fontSize: '12px', fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' },
    footerText: { fontSize: '12px', color: theme.subText, lineHeight: '1.6' },
    footerLink: { fontSize: '12px', color: theme.subText, textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    
    // Stats Style
    statsRow: {
      display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px', 
      padding: '8px', borderRadius: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`
    },
    statItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: theme.text, fontWeight: '600' }
  }

  return (
    <div style={s.wrapper}>
      <nav style={s.nav}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={s.logo}>Doodle to Image</div>
          <span style={s.navBadge}>Running on RTX 2050 (Local)</span>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
           <button style={s.iconBtn} onClick={() => setIsDarkMode(!isDarkMode)}> {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} </button>
        </div>
      </nav>

      <div style={s.workspace}>
        <div style={s.card}>
          <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', height: '40px'}}>
             <h3 style={{margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text}}>Canvas</h3>
             <div style={s.toolbar}>
                <button title="Pencil" style={s.toolBtn(mode === 'draw')} onClick={() => setMode('draw')}><Pencil size={16} /></button>
                <button title="Fill" style={s.toolBtn(mode === 'fill')} onClick={() => setMode('fill')}><PaintBucket size={16} /></button>
                <button title="Eraser" style={s.toolBtn(mode === 'erase')} onClick={() => setMode('erase')}><Eraser size={16} /></button>
                <div style={{width: '1px', height: '16px', background: theme.border, margin: '0 4px'}}></div>
                <input type="color" value={brushColor} onChange={(e) => { setBrushColor(e.target.value); setMode(mode === 'erase' ? 'draw' : mode) }} style={{width: '24px', height: '24px', padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px'}} />
             </div>
             <div style={{display: 'flex', gap: '5px'}}>
               <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleImageUpload} />
               <button onClick={() => fileInputRef.current.click()} style={s.secondaryBtn} title="Upload Reference"><Upload size={14} /></button>
               <button onClick={handleUndo} disabled={historyStep <= 0} style={{...s.secondaryBtn, opacity: historyStep <= 0 ? 0.5 : 1}} title="Undo"><Undo size={14}/></button>
               <button onClick={handleRedo} disabled={historyStep >= history.length - 1} style={{...s.secondaryBtn, opacity: historyStep >= history.length - 1 ? 0.5 : 1}} title="Redo"><Redo size={14}/></button>
               <button onClick={clearCanvas} style={{...s.secondaryBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)'}} title="Clear"><RefreshCw size={14}/></button>
             </div>
          </div>
          <div style={s.canvasWrapper} onMouseEnter={() => setShowCursor(true)} onMouseLeave={() => setShowCursor(false)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div style={s.dragOverlay}>Drop Image Here</div>
            <div style={s.cursor} />
            <canvas ref={canvasRef} width={512} height={512} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
          </div>
          <div style={{width: '100%', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px'}}>
            <label style={{fontSize: '12px', color: theme.subText}}>Brush Size</label>
            <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{flex: 1, cursor: 'pointer', accentColor: theme.accent}} />
            <span style={{fontSize: '12px', fontWeight: 'bold', width: '30px', textAlign: 'right'}}>{brushSize}px</span>
          </div>
        </div>

        <div style={{...s.card, maxWidth: '400px', width: '100%', alignSelf: 'stretch'}}>
          <div style={{width: '100%', marginBottom: '20px'}}>
            <h3 style={{margin: '0 0 15px 0', fontSize: '18px', fontWeight: '700'}}>Configuration</h3>
            <label style={{fontSize: '13px', fontWeight: '600', color: theme.subText, marginBottom: '6px', display: 'block'}}>Style Presets</label>
            <div style={s.chipContainer}>
              {['Cinematic', 'Anime', 'Oil Paint', '3D', 'Sketch'].map(style => (
                <button key={style} onClick={() => applyPreset(style)} style={s.chip} onMouseOver={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent }} onMouseOut={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.subText }}>{style}</button>
              ))}
            </div>
            <label style={{fontSize: '13px', fontWeight: '600', color: theme.subText, marginBottom: '6px', display: 'block'}}>Positive Prompt</label>
            <div style={{position: 'relative', marginBottom: '15px'}}>
              <textarea rows={3} style={{...s.input, resize: 'none', fontFamily: 'inherit'}} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <button onClick={surpriseMe} title="Surprise Me" style={{position: 'absolute', bottom: '8px', right: '8px', background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: '4px'}}><Dices size={18}/></button>
            </div>
            <label style={{fontSize: '13px', fontWeight: '600', color: theme.subText, marginBottom: '6px', display: 'block'}}>Negative Prompt</label>
            <input type="text" style={{...s.input, borderColor: isDarkMode ? '#7f1d1d' : '#fecaca', color: isDarkMode ? '#fca5a5' : '#dc2626'}} value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)} />
            <div style={{display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center'}}>
               <div style={{flex: 1}}>
                  <label style={{fontSize: '13px', fontWeight: '600', color: theme.subText, marginBottom: '6px', display: 'block'}}>Seed (-1 for random)</label>
                  <input type="number" style={s.input} value={seed} onChange={(e) => setSeed(e.target.value)} />
               </div>
               <div style={{flex: 1}}>
                  <label style={{fontSize: '13px', fontWeight: '600', color: theme.subText, marginBottom: '6px', display: 'block'}}>Inference Steps</label>
                  <input type="number" style={s.input} value="25" disabled title="Fixed for optimization" />
               </div>
            </div>
          </div>

          {/* STATS DISPLAY */}
          {genStats && (
            <div style={s.statsRow}>
              <div style={s.statItem} title="Generation Time">
                <Clock size={16} color={theme.accent} /> 
                {genStats.time}s
              </div>
              <div style={s.statItem} title="Doodle Match Confidence">
                <Target size={16} color="#10b981" /> 
                {genStats.accuracy}% Match
              </div>
            </div>
          )}

          <button onClick={generateImage} disabled={loading} style={{...s.primaryBtn, opacity: loading ? 0.7 : 1, marginTop: 'auto'}}>
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} 
            {loading ? 'Generating...' : 'Generate Art'}
          </button>
        </div>

        <div style={s.card}>
          <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', height: '40px'}}>
             <h3 style={{margin: 0, fontSize: '18px', fontWeight: '700'}}>Result</h3>
             {result && (
                <a href={result} download="doodle_art.png" style={{textDecoration: 'none'}}>
                  <button style={{...s.secondaryBtn, background: theme.accent, color: 'white', borderColor: theme.accent}}><Download size={14}/> Save</button>
                </a>
             )}
          </div>
          <div style={s.resultBox}>
            {result ? ( <img src={result} alt="Generated" style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px'}} /> ) : ( <div style={{textAlign: 'center', color: theme.subText, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}><ImageIcon size={64} style={{opacity: 0.2}}/><p style={{margin: 0, fontSize: '14px'}}>Your masterpiece awaits.</p></div> )}
          </div>
          <div style={{marginTop: '15px', fontSize: '12px', color: theme.subText, textAlign: 'center', maxWidth: '400px'}}> Tip: Use the "Fill" tool to create solid shapes for better recognition. </div>
        </div>
      </div>

      <footer style={s.footer}>
        <div style={s.footerContent}>
          <div style={{...s.footerCol, flex: 2}}>
            <span style={{fontSize: '12px', fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px'}}>How it Works</span>
            <p style={s.footerText}>This application runs a full diffusion pipeline locally on your machine. When you draw, your doodle is converted into a "control map". Stable Diffusion uses this map to guide the denoising process, turning random noise into a coherent image.</p>
          </div>
          <div style={s.footerCol}>
            <span style={{fontSize: '12px', fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px'}}>Models & AI</span>
            <div style={s.footerLink}><Layers size={14}/> DreamShaper 8 (Optimized)</div>
            <div style={s.footerLink}><Wand2 size={14}/> ControlNet (Scribble)</div>
            <div style={s.footerLink}><Database size={14}/> TinyVAE + UniPC</div>
          </div>
          <div style={s.footerCol}>
            <span style={{fontSize: '12px', fontWeight: '700', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px'}}>Hardware & Data</span>
            <div style={s.footerLink}><Cpu size={14}/> RTX 2050 (fp16)</div>
            <div style={s.footerLink}><Database size={14}/> LAION-5B Dataset</div>
            <div style={s.footerLink}><Github size={14}/> HuggingFace Diffusers</div>
          </div>
        </div>
        <div style={{textAlign: 'center', marginTop: '30px', fontSize: '11px', color: theme.subText}}> Local Generative AI Project • Powered by PyTorch & React </div>
      </footer>
    </div>
  )
}

export default App