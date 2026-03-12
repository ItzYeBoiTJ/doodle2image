import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler, AutoencoderTiny
from PIL import Image
import numpy as np

# Global variable to hold the model in memory
pipe = None

def load_model():
    global pipe
    if pipe is not None:
        return

    print("Loading ControlNet (Scribble)...")
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-scribble",
        torch_dtype=torch.float16
    )

    print("Loading TinyVAE (VRAM Saver)...")
    # TinyVAE reduces VRAM usage - Critical for RTX 2050
    vae = AutoencoderTiny.from_pretrained(
        "madebyollin/taesd", 
        torch_dtype=torch.float16
    )

    print("Loading DreamShaper 8...")
    # DreamShaper produces better art than SD1.5 but runs at the same speed
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "Lykon/dreamshaper-8",
        controlnet=controlnet,
        vae=vae,
        torch_dtype=torch.float16,
        safety_checker=None 
    )

    # Reverted to UniPC: The fastest scheduler for local GPUs
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

    # Optimizations
    pipe.enable_model_cpu_offload()
    pipe.enable_attention_slicing()
    
    print("Model loaded successfully (Performance Mode)!")

def generate_image(prompt: str, negative_prompt: str, image: Image.Image, steps: int = 20, guidance: float = 7.5, seed: int = -1):
    global pipe
    if pipe is None:
        load_model()

    if seed == -1:
        generator = None
    else:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    # Resize to 512x512
    input_image = image.resize((512, 512))

    output = pipe(
        prompt,
        negative_prompt=negative_prompt,
        image=input_image,
        num_inference_steps=steps,
        guidance_scale=guidance,
        generator=generator,
    ).images[0]

    return output