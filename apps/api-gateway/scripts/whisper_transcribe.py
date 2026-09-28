#!/usr/bin/env python3
"""
DOC SEARCH - Self-Hosted Whisper Transcription Bridge
Executes local OpenAI Whisper inference with structured JSON output,
zero audio retention, and strict PHI isolation.
"""

import sys
import os
import json
import argparse
import time
import math

# Auto-inject known FFmpeg directories into PATH if not present
def ensure_ffmpeg_in_path():
    import shutil
    if shutil.which("ffmpeg"):
        return

    known_paths = []
    configured_path = os.environ.get("WHISPER_FFMPEG_PATH") or os.environ.get("FFMPEG_PATH")
    if configured_path:
        known_paths.append(configured_path)

    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            winget_dir = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages")
            if os.path.isdir(winget_dir):
                try:
                    for entry in os.listdir(winget_dir):
                        if "ffmpeg" in entry.lower():
                            full_pkg = os.path.join(winget_dir, entry)
                            if os.path.isdir(full_pkg):
                                for sub in os.listdir(full_pkg):
                                    bin_cand = os.path.join(full_pkg, sub, "bin")
                                    if os.path.isfile(os.path.join(bin_cand, "ffmpeg.exe")):
                                        known_paths.append(bin_cand)
                except Exception:
                    pass

        program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        known_paths.extend([
            os.path.join(program_files, "ffmpeg", "bin"),
            r"C:\ffmpeg\bin"
        ])
    else:
        known_paths.extend([
            "/usr/bin",
            "/usr/local/bin",
            "/opt/homebrew/bin"
        ])

    exe_name = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
    for p in known_paths:
        if p and os.path.isdir(p) and os.path.isfile(os.path.join(p, exe_name)):
            os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")
            if shutil.which("ffmpeg"):
                break

ensure_ffmpeg_in_path()

try:
    import torch
    import whisper
except ImportError as e:
    output = {
        "success": False,
        "error": "Required speech recognition dependencies are unavailable.",
        "code": "DEPENDENCY_ERROR"
    }
    sys.stdout.write(json.dumps(output))
    sys.exit(1)


def parse_arguments():
    parser = argparse.ArgumentParser(description="Self-Hosted Whisper Transcription Worker")
    parser.add_argument("--audio", required=True, help="Path to input audio file")
    parser.add_argument("--model", default=os.environ.get("WHISPER_MODEL", "turbo"), help="Whisper model name")
    parser.add_argument("--device", default=os.environ.get("WHISPER_DEVICE", "auto"), help="Device: auto, cpu, or cuda")
    parser.add_argument("--language", default=os.environ.get("WHISPER_LANGUAGE", "auto"), help="Language code or auto")
    parser.add_argument("--model-dir", default=os.environ.get("WHISPER_MODEL_DIR", None), help="Whisper model cache directory")
    parser.add_argument("--prompt", default="", help="Optional clinical vocabulary prompt")
    parser.add_argument("--temperature", type=float, default=0.0, help="Sampling temperature")
    return parser.parse_args()


def calculate_confidence(segments):
    if not segments:
        return 0.95
    logprobs = [s.get("avg_logprob", -0.2) for s in segments if "avg_logprob" in s]
    if not logprobs:
        return 0.95
    avg_logprob = sum(logprobs) / len(logprobs)
    confidence = max(0.1, min(0.99, math.exp(avg_logprob)))
    return round(confidence, 3)


def main():
    start_time = time.time()
    args = parse_arguments()

    if not os.path.isfile(args.audio):
        res = {
            "success": False,
            "error": "Audio file not found or inaccessible",
            "code": "FILE_NOT_FOUND"
        }
        sys.stdout.write(json.dumps(res))
        sys.exit(1)

    device_name = args.device.lower()
    if device_name == "auto":
        device_name = "cuda" if torch.cuda.is_available() else "cpu"
    elif device_name == "cuda" and not torch.cuda.is_available():
        device_name = "cpu"

    try:
        model_name = args.model
        load_kwargs = {"device": device_name}
        if args.model_dir:
            load_kwargs["download_root"] = args.model_dir

        try:
            model = whisper.load_model(model_name, **load_kwargs)
        except Exception as load_err:
            if model_name != "base":
                model_name = "base"
                model = whisper.load_model("base", **load_kwargs)
            else:
                raise load_err

        transcribe_kwargs = {
            "temperature": args.temperature,
            "fp16": (device_name == "cuda")
        }

        if args.language and args.language.lower() != "auto":
            transcribe_kwargs["language"] = args.language.lower()

        if args.prompt:
            transcribe_kwargs["initial_prompt"] = args.prompt

        result = model.transcribe(args.audio, **transcribe_kwargs)

        transcript_text = result.get("text", "").strip()
        detected_language = result.get("language", "unknown")
        segments = result.get("segments", [])
        confidence = calculate_confidence(segments)

        duration_seconds = 0.0
        if segments:
            duration_seconds = round(segments[-1].get("end", 0.0), 2)

        execution_latency_ms = int((time.time() - start_time) * 1000)

        output = {
            "success": True,
            "transcript": transcript_text,
            "language": detected_language,
            "durationSeconds": duration_seconds,
            "confidence": confidence,
            "model": model_name,
            "device": device_name,
            "latencyMs": execution_latency_ms
        }
        sys.stdout.write(json.dumps(output))
        sys.exit(0)

    except Exception as exc:
        sys.stderr.write(f"Whisper transcription error: {str(exc)}\n")
        output = {
            "success": False,
            "error": "Speech transcription execution failed",
            "code": "TRANSCRIPTION_ERROR",
            "latencyMs": int((time.time() - start_time) * 1000)
        }
        sys.stdout.write(json.dumps(output))
        sys.exit(1)


if __name__ == "__main__":
    main()
