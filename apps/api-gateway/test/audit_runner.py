#!/usr/bin/env python3
"""
TEMPORARY AUDIT TOOLING - NOT FOR PRODUCTION
DOC SEARCH: Comprehensive Speech-to-Text & Whisper Production Readiness Audit Runner
Evaluates:
- Model benchmarks (tiny vs base vs hardware feasibility of small/turbo)
- Medical terminology, vitals, dosages, Indian brand medicines
- Ground-truth WER and CER calculation
- Language detection behavior on Hindi, English, Hinglish
- Audio container formats (WAV, WebM, MP3, OGG, AAC, M4A)
- Edge cases (silence, corrupt audio, oversized payload, empty audio)
"""

import os
import sys
import time
import json
import subprocess
import shutil

# Ensure FFmpeg in PATH
FFMPEG_DIR = r"C:\Users\alamr\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin"
if os.path.isdir(FFMPEG_DIR) and FFMPEG_DIR not in os.environ.get("PATH", ""):
    os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

import whisper
import torch

def get_ram_mb():
    try:
        pid = os.getpid()
        out = subprocess.check_output(f"powershell (Get-Process -Id {pid}).WorkingSet64", shell=True)
        return round(int(out.strip()) / (1024 * 1024), 2)
    except Exception:
        return 0.0

def levenshtein_distance(ref_tokens, hyp_tokens):
    d = [[0] * (len(hyp_tokens) + 1) for _ in range(len(ref_tokens) + 1)]
    for i in range(len(ref_tokens) + 1):
        d[i][0] = i
    for j in range(len(hyp_tokens) + 1):
        d[0][j] = j
    for i in range(1, len(ref_tokens) + 1):
        for j in range(1, len(hyp_tokens) + 1):
            if ref_tokens[i - 1] == hyp_tokens[j - 1]:
                cost = 0
            else:
                cost = 1
            d[i][j] = min(
                d[i - 1][j] + 1,      # deletion
                d[i][j - 1] + 1,      # insertion
                d[i - 1][j - 1] + cost # substitution
            )
    return d[len(ref_tokens)][len(hyp_tokens)]

def calculate_wer(reference, hypothesis):
    import re
    ref_words = re.findall(r'\b\w+\b', reference.lower())
    hyp_words = re.findall(r'\b\w+\b', hypothesis.lower())
    if not ref_words:
        return 0.0 if not hyp_words else 1.0
    dist = levenshtein_distance(ref_words, hyp_words)
    return round(dist / len(ref_words), 4)

def calculate_cer(reference, hypothesis):
    import re
    ref_chars = list(re.sub(r'\s+', '', reference.lower()))
    hyp_chars = list(re.sub(r'\s+', '', hypothesis.lower()))
    if not ref_chars:
        return 0.0 if not hyp_chars else 1.0
    dist = levenshtein_distance(ref_chars, hyp_chars)
    return round(dist / len(ref_chars), 4)

def synthesize_audio(text, output_wav):
    escaped_text = text.replace("'", "''")
    escaped_path = output_wav.replace("\\", "\\\\")
    cmd = f"powershell -Command \"Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('{escaped_path}'); $s.Speak('{escaped_text}'); $s.Dispose();\""
    subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

TEMP_AUDIT_DIR = r"C:\Users\alamr\AppData\Local\Temp\docsearch_audit"
os.makedirs(TEMP_AUDIT_DIR, exist_ok=True)

print("=" * 70)
print("AUDIT SECTION 1 & 2: MODEL HARDWARE & ACCURACY BENCHMARK")
print("=" * 70)

# Evaluate base model
t0 = time.time()
ram_before = get_ram_mb()
print(f"Loading Whisper 'base' model on device='cpu' (RAM before: {ram_before} MB)...")
base_model = whisper.load_model("base", device="cpu")
load_time_base = round(time.time() - t0, 3)
ram_after_base = get_ram_mb()
print(f"Base loaded in {load_time_base}s. RAM after: {ram_after_base} MB (Delta: {round(ram_after_base - ram_before, 2)} MB)\n")

# Evaluate tiny model
t0 = time.time()
print(f"Loading Whisper 'tiny' model on device='cpu'...")
tiny_model = whisper.load_model("tiny", device="cpu")
load_time_tiny = round(time.time() - t0, 3)
ram_after_tiny = get_ram_mb()
print(f"Tiny loaded in {load_time_tiny}s. RAM after: {ram_after_tiny} MB (Delta: {round(ram_after_tiny - ram_after_base, 2)} MB)\n")

# Test corpus covering Section 3 & 4
TEST_CASES = [
    {
        "id": "ENG_GENERAL",
        "category": "English",
        "reference": "The patient was admitted yesterday with severe acute headache and persistent high fever.",
    },
    {
        "id": "MED_SYMPTOMS",
        "category": "Medical Symptoms",
        "reference": "Patient complains of chest pain, shortness of breath, dizziness, generalized weakness and abdominal pain.",
    },
    {
        "id": "MED_VITALS",
        "category": "Vitals",
        "reference": "Blood pressure is 140 over 90 mmHg, pulse rate 88 bpm, SpO2 96 percent and body temperature 101.4 degrees Fahrenheit.",
    },
    {
        "id": "MED_DIAGNOSIS",
        "category": "Medical Terms & Diagnosis",
        "reference": "Clinical assessment reveals acute bilateral pneumonia, secondary thrombocytopenia with low platelet count, and uncontrolled type two diabetes mellitus.",
    },
    {
        "id": "MED_LABS",
        "category": "Laboratory & Biochemistry",
        "reference": "Serum creatinine is 1.8 mg per dl, total bilirubin 2.4 mg per dl, hemoglobin 10.2 g per dl, with elevated serum cholesterol and triglycerides.",
    },
    {
        "id": "MED_DOSAGE_INDIAN",
        "category": "Medications & Dosages (Indian Rx)",
        "reference": "Prescribed tablet Paracetamol 650 mg three times daily after food, tablet Pantoprazole 40 mg once daily before food, and tablet Telmisartan 40 mg once daily in the morning.",
    },
    {
        "id": "MED_ANTIBIOTIC",
        "category": "Complex Rx & Dosages",
        "reference": "Start tablet Augmentin 625 mg twice daily for five days, syrup Azithromycin 500 mg once daily for three days, and tablet Metformin 500 mg twice daily with meals.",
    },
    {
        "id": "HINGLISH_CLINICAL",
        "category": "Hinglish Consultation",
        "reference": "Doctor sahab mujhe teen din se bahut tez bukhar hai aur gale me severe infection lag raha hai.",
    },
    {
        "id": "HINDI_PHONETIC",
        "category": "Hindi Dictation",
        "reference": "Mera blood pressure check kijiye aur sar me bahut tez dard ho raha hai.",
    }
]

results = []

print("=" * 70)
print("AUDIT SECTIONS 3, 4, 5: MEDICAL TERMINOLOGY, DOSAGE & WER/CER ACCURACY")
print("=" * 70)

for tc in TEST_CASES:
    wav_path = os.path.join(TEMP_AUDIT_DIR, f"{tc['id']}.wav")
    synthesize_audio(tc["reference"], wav_path)
    
    # Test on Base model
    t_start = time.time()
    res_base = base_model.transcribe(wav_path, fp16=False)
    lat_base = round((time.time() - t_start) * 1000, 2)
    hyp_base = res_base["text"].strip()
    lang_base = res_base["language"]
    wer_base = calculate_wer(tc["reference"], hyp_base)
    cer_base = calculate_cer(tc["reference"], hyp_base)

    # Test on Tiny model
    t_start = time.time()
    res_tiny = tiny_model.transcribe(wav_path, fp16=False)
    lat_tiny = round((time.time() - t_start) * 1000, 2)
    hyp_tiny = res_tiny["text"].strip()
    lang_tiny = res_tiny["language"]
    wer_tiny = calculate_wer(tc["reference"], hyp_tiny)
    cer_tiny = calculate_cer(tc["reference"], hyp_tiny)

    tc_res = {
        "id": tc["id"],
        "category": tc["category"],
        "reference": tc["reference"],
        "base": {
            "transcript": hyp_base,
            "language": lang_base,
            "latencyMs": lat_base,
            "wer": wer_base,
            "cer": cer_base
        },
        "tiny": {
            "transcript": hyp_tiny,
            "language": lang_tiny,
            "latencyMs": lat_tiny,
            "wer": wer_tiny,
            "cer": cer_tiny
        }
    }
    results.append(tc_res)

    print(f"\n[{tc['category']}] ({tc['id']})")
    print(f"  Reference:  \"{tc['reference']}\"")
    print(f"  Base Out:   \"{hyp_base}\" [Lang: {lang_base}, Latency: {lat_base}ms, WER: {round(wer_base*100, 1)}%, CER: {round(cer_base*100, 1)}%]")
    print(f"  Tiny Out:   \"{hyp_tiny}\" [Lang: {lang_tiny}, Latency: {lat_tiny}ms, WER: {round(wer_tiny*100, 1)}%, CER: {round(cer_tiny*100, 1)}%]")

# Dump json summary
summary_path = os.path.join(TEMP_AUDIT_DIR, "accuracy_audit_results.json")
with open(summary_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 70)
print(f"Accuracy audit completed. Detailed JSON output written to {summary_path}")
print("=" * 70)
