Doodle2ImageDoodle2Image is a local generative AI web application designed to transform rough sketches into high-quality artistic images. The primary objective of this project is to run a complete Stable Diffusion and ControlNet pipeline efficiently on consumer-grade hardware with limited VRAM (such as the NVIDIA RTX 2050 with 4GB VRAM).Through rigorous hardware optimizations, the application delivers stable and fast local inference.FeaturesInteractive Canvas: Draw directly on the built-in canvas (equipped with pen, eraser, and flood-fill tools) or upload a reference image via drag-and-drop.Low VRAM Optimization: Engineered to operate on 4GB GPUs utilizing float16 precision, CPU offloading, attention slicing, and TinyVAE.High-Fidelity Generation: Utilizes DreamShaper 8 in conjunction with ControlNet Scribble to ensure the generated output accurately respects the structural lines of the original sketch.High Performance: Implements a UniPC scheduler to achieve quality results in 20 inference steps. Includes real-time generation metrics (processing time and structural match confidence).User Experience: Features a dark mode interface, customizable style presets (Anime, Cinematic, Oil Paint, etc.), and comprehensive undo/redo history tracking.ArchitectureFrontend: React + ViteBackend: Python (FastAPI)AI Pipeline: PyTorch + HuggingFace DiffusersBase Model: Lykon/dreamshaper-8ControlNet: lllyasviel/sd-controlnet-scribbleVAE: madebyollin/taesd (Optimized for low VRAM consumption)InstallationPrerequisitesPython 3.10+Node.jsNVIDIA GPU (Minimum 4GB VRAM recommended)
1. Backend
Setup
Open a terminal in the project directory and execute the following commands to configure the Python environment:
# Navigate to the backend directory
`cd backend`

# Create and activate a virtual environment
`python -m venv venv`
`.\venv\Scripts\Activate.ps1`

# Install PyTorch with CUDA 12.1 support
`pip install torch==2.2.0 torchvision==0.17.0 --index-url [https://download.pytorch.org/whl/cu121](https://download.pytorch.org/whl/cu121)`

# Install remaining dependencies
`pip install fastapi "uvicorn[standard]" transformers diffusers accelerate safetensors huggingface-hub Pillow opencv-python-headless einops python-multipart aiofiles scipy "numpy<2.0"`
2. Frontend SetupOpen a separate terminal window:
# Navigate to the frontend directory
`cd frontend`

# Install Node dependencies
`npm install`

Usage:
To launch the application, both the backend and frontend servers must be running concurrently.
Terminal 1 (Backend Server):
`cd backend`
`.\venv\Scripts\Activate.ps1`

# Optional: Configure memory allocation for 4GB VRAM GPUs to prevent memory fragmentation
`$env:PYTORCH_CUDA_ALLOC_CONF = "max_split_size_mb:128"`

`python server.py`
Wait until the terminal outputs: Uvicorn running on http://127.0.0.1:8000

Terminal 2 (Frontend Server):
`cd frontend`
`npm run dev`

Navigate to http://localhost:3000 in your web browser.

Troubleshooting
"RuntimeError: Numpy is not available" - This occurs due to a compatibility issue between PyTorch and NumPy 2.0+.
Resolution: Execute pip install "numpy<2.0" in your backend terminal.

"CUDA out of memory" - The GPU has insufficient memory to process the request.
Resolution: Ensure the $env:PYTORCH_CUDA_ALLOC_CONF = "max_split_size_mb:128" environment variable is set before starting the server. If the issue persists, restart the Python terminal to clear residual VRAM allocation.

"Unexpected Token / JSON error" (Frontend) - This indicates the Python backend failed during image generation and returned an error stack trace instead of the expected JSON payload.
Resolution: Review the backend terminal for the specific exception, restart the backend server, and refresh the web application.

License
This is an open-source project. You are free to fork, modify, and distribute the codebase.
