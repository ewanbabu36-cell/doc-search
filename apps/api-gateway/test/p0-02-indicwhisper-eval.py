#!/usr/bin/env python3
"""
DOC SEARCH - P0-02 IndicWhisper Evaluation
Model: vasista22/whisper-hindi-small (Vasista Sai Lodagala / AI4Bharat contributor)
Evaluates 8 fast diagnostic samples from P0-02 corpus:
- 3 Hindi (CORPUS-HINDI-023, 024, 025)
- 3 Hinglish (CORPUS-HINGLISH-001, 002, 003)
- 1 Medicine prescription (CORPUS-HINGLISH-012)
- 1 Numeric/Vital Anchor (CORPUS-ANCHOR-030)
Timeout SLA: 15.0s per sample
"""

import sys
import os
import json
import time
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Inject local FFmpeg if present
local_app_data = os.environ.get("LOCALAPPDATA", "")
ffmpeg_bin = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-9.0.1-full_build", "bin")
if os.path.isdir(ffmpeg_bin):
    os.environ["PATH"] = ffmpeg_bin + os.pathsep + os.environ.get("PATH", "")

import torch
import whisper
from transformers import WhisperProcessor, WhisperForConditionalGeneration

AUDIO_DIR = os.path.join(os.environ.get("TEMP", r"C:\Users\alamr\AppData\Local\Temp"), "docsearch_p0_02_corpus")
CORPUS_JSON = os.path.join(os.path.dirname(__file__), "p0-02-corpus.json")

TARGET_SAMPLE_IDS = [
    # 3 Hindi
    "CORPUS-HINDI-023",
    "CORPUS-HINDI-024",
    "CORPUS-HINDI-025",
    # 3 Hinglish
    "CORPUS-HINGLISH-001",
    "CORPUS-HINGLISH-002",
    "CORPUS-HINGLISH-003",
    # 1 Medicine
    "CORPUS-HINGLISH-012",
    # 1 Numeric/vital
    "CORPUS-ANCHOR-030"
]

def get_process_ram_mb():
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return round(process.memory_info().rss / (1024 * 1024), 2)
    except Exception:
        try:
            out = os.popen(f'tasklist /FI "PID eq {os.getpid()}" /FO CSV /NH').read()
            parts = out.strip().split('","')
            if len(parts) >= 5:
                mem_str = parts[4].replace('"', '').replace(' K', '').replace(',', '').strip()
                return round(float(mem_str) / 1024.0, 2)
        except Exception:
            pass
        return 0.0

def levenshtein_tokens(a, b):
    an, bn = len(a), len(b)
    if an == 0: return bn
    if bn == 0: return an
    matrix = [[0] * (bn + 1) for _ in range(an + 1)]
    for i in range(an + 1): matrix[i][0] = i
    for j in range(bn + 1): matrix[0][j] = j
    for i in range(1, an + 1):
        for j in range(1, bn + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            matrix[i][j] = min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    return matrix[an][bn]

def normalize_tokens(text):
    clean = re.sub(r"[^a-zA-Z0-9\u0900-\u097f\s]", " ", text.lower())
    return [t for t in clean.split() if t]

def compute_wer(ref, hyp):
    r = normalize_tokens(ref)
    h = normalize_tokens(hyp)
    if not r: return 0.0 if not h else 1.0
    return levenshtein_tokens(r, h) / len(r)

def compute_cer(ref, hyp):
    r = re.sub(r"\s+", "", ref.lower())
    h = re.sub(r"\s+", "", hyp.lower())
    if not r: return 0.0 if not h else 1.0
    return levenshtein_tokens(list(r), list(h)) / len(r)

def evaluate_sample(item, hyp_text):
    wer = compute_wer(item["groundTruth"], hyp_text)
    cer = compute_cer(item["groundTruth"], hyp_text)

    # Medicine preservation (case-insensitive check in raw transcript)
    med_pres = 0
    for med in item.get("expectedMedicines", []):
        if med.lower() in hyp_text.lower():
            med_pres += 1
    med_acc = 1.0 if not item.get("expectedMedicines") else (med_pres / len(item["expectedMedicines"]))

    # Numeric preservation
    num_pres = 0
    hyp_toks = normalize_tokens(hyp_text)
    for num in item.get("expectedNumerics", []):
        if num.lower() in hyp_toks or num in hyp_text:
            num_pres += 1
    num_acc = 1.0 if not item.get("expectedNumerics") else (num_pres / len(item["expectedNumerics"]))

    # Terms preservation
    term_pres = 0
    for term in item.get("criticalTerms", []):
        words = term.lower().split()
        if all(w in hyp_text.lower() for w in words):
            term_pres += 1
    term_acc = 1.0 if not item.get("criticalTerms") else (term_pres / len(item["criticalTerms"]))

    return wer, cer, med_acc, num_acc, term_acc

def main():
    print("=" * 70)
    print("DOC SEARCH — P0-02 INDICWHISPER DIAGNOSTIC EVALUATION")
    print("Model: vasista22/whisper-hindi-small (HuggingFace)")
    print("=" * 70)

    initial_ram = get_process_ram_mb()
    print(f"Initial Process RAM: {initial_ram} MB")

    print("\nLoading Model & Processor...")
    t_load_start = time.time()
    MODEL_ID = "vasista22/whisper-hindi-small"
    processor = WhisperProcessor.from_pretrained(MODEL_ID)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_ID)
    model.eval()
    load_time = time.time() - t_load_start
    post_load_ram = get_process_ram_mb()
    model_ram_delta = round(post_load_ram - initial_ram, 2)

    param_count = sum(p.numel() for p in model.parameters())
    print(f"Model Loaded Successfully in {load_time:.2f}s")
    print(f"Total Parameters: {param_count:,}")
    print(f"RAM after load: {post_load_ram} MB (Model footprint: ~{model_ram_delta} MB)")

    with open(CORPUS_JSON, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    items = [item for item in corpus if item["id"] in TARGET_SAMPLE_IDS]
    items.sort(key=lambda x: TARGET_SAMPLE_IDS.index(x["id"]))

    print(f"\nRunning 8 Diagnostic Samples (Timeout SLA: 15.0s per sample):")
    results = []
    latencies = []
    timeouts = 0

    for idx, item in enumerate(items):
        wav_file = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        if not os.path.exists(wav_file):
            print(f"Error: Missing audio file {wav_file}")
            continue

        audio = whisper.load_audio(wav_file)
        inputs = processor(audio, sampling_rate=16000, return_tensors="pt")

        t0 = time.time()
        with torch.no_grad():
            predicted_ids = model.generate(inputs.input_features, max_new_tokens=64)
        dur_s = time.time() - t0
        dur_ms = int(dur_s * 1000)
        latencies.append(dur_ms)

        raw_decoded = processor.tokenizer.decode(predicted_ids[0], skip_special_tokens=True)
        # Clean any leaked special token tags
        hyp_text = re.sub(r"<\|.*?\|>", "", raw_decoded).strip()

        is_timeout = dur_s > 15.0
        if is_timeout:
            timeouts += 1

        # Detect script
        has_devanagari = bool(re.search(r"[\u0900-\u097f]", hyp_text))
        has_latin = bool(re.search(r"[a-zA-Z]", hyp_text))
        if has_devanagari and has_latin:
            output_format = "MIXED_DEVANAGARI_LATIN"
        elif has_devanagari:
            output_format = "DEVANAGARI"
        elif has_latin:
            output_format = "LATIN"
        else:
            output_format = "EMPTY/PUNCTUATION"

        wer, cer, med_acc, num_acc, term_acc = evaluate_sample(item, hyp_text)

        res_entry = {
            "id": item["id"],
            "language": item["language"],
            "category": item["category"],
            "groundTruth": item["groundTruth"],
            "rawHypothesis": raw_decoded,
            "cleanedHypothesis": hyp_text,
            "outputFormat": output_format,
            "latencyMs": dur_ms,
            "latencySec": round(dur_s, 2),
            "timeoutBreach": is_timeout,
            "wer": round(wer, 4),
            "cer": round(cer, 4),
            "medAcc": round(med_acc, 4),
            "numAcc": round(num_acc, 4),
            "termAcc": round(term_acc, 4),
            "expectedMedicines": item.get("expectedMedicines", []),
            "expectedNumerics": item.get("expectedNumerics", []),
            "criticalTerms": item.get("criticalTerms", [])
        }
        results.append(res_entry)

        status_tag = "TIMEOUT_BREACH" if is_timeout else "PASS_SLA"
        print(f"\n[{idx+1}/{len(items)}] {item['id']} ({item['language']}) - [{status_tag}] Latency: {dur_s:.2f}s ({dur_ms}ms)")
        print(f"   REF: \"{item['groundTruth']}\"")
        print(f"   HYP: \"{hyp_text}\" (Format: {output_format})")
        print(f"   WER: {wer*100:.1f}% | CER: {cer*100:.1f}% | MedAcc: {med_acc*100:.0f}% | NumAcc: {num_acc*100:.0f}% | TermAcc: {term_acc*100:.0f}%")

    def filter_lang(l): return [r for r in results if r["language"] == l]
    def avg(lst, k): return (sum(x[k] for x in lst) / len(lst)) if lst else 0.0

    hi = filter_lang("HINDI")
    hng = filter_lang("HINGLISH")

    avg_lat = int(sum(latencies) / len(latencies)) if latencies else 0
    final_ram = get_process_ram_mb()

    summary = {
        "modelIdentity": {
            "name": "vasista22/whisper-hindi-small",
            "source": "HuggingFace",
            "license": "Apache-2.0",
            "parameters": param_count,
            "baseArchitecture": "Whisper Small (241M)",
            "runtime": "PyTorch 2.14.0 + Transformers 5.17.0 (CPU)"
        },
        "sampleCount": len(results),
        "timeoutCount": timeouts,
        "timeoutRate": round(timeouts / len(results), 2) if results else 0,
        "avgLatencyMs": avg_lat,
        "avgLatencySec": round(avg_lat / 1000.0, 2),
        "initialRamMb": initial_ram,
        "postLoadRamMb": post_load_ram,
        "peakRamMb": final_ram,
        "hindiMetrics": {
            "wer": round(avg(hi, "wer"), 4),
            "cer": round(avg(hi, "cer"), 4)
        },
        "hinglishMetrics": {
            "wer": round(avg(hng, "wer"), 4),
            "cer": round(avg(hng, "cer"), 4)
        },
        "clinicalMetrics": {
            "medicineAccuracy": round(avg(results, "medAcc"), 4),
            "numericAccuracy": round(avg(results, "numAcc"), 4),
            "clinicalTermAccuracy": round(avg(results, "termAcc"), 4)
        },
        "results": results
    }

    out_file = os.path.join(os.path.dirname(__file__), "p0-02-indicwhisper-results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print("INDICWHISPER EVALUATION SUMMARY")
    print("=" * 70)
    print(f"Hindi WER:              {summary['hindiMetrics']['wer']*100:.2f}%")
    print(f"Hindi CER:              {summary['hindiMetrics']['cer']*100:.2f}%")
    print(f"Hinglish WER:           {summary['hinglishMetrics']['wer']*100:.2f}%")
    print(f"Hinglish CER:           {summary['hinglishMetrics']['cer']*100:.2f}%")
    print(f"Medicine Accuracy:      {summary['clinicalMetrics']['medicineAccuracy']*100:.2f}%")
    print(f"Numeric/Vital Accuracy: {summary['clinicalMetrics']['numericAccuracy']*100:.2f}%")
    print(f"Clinical Term Accuracy: {summary['clinicalMetrics']['clinicalTermAccuracy']*100:.2f}%")
    print(f"Average Latency:        {summary['avgLatencySec']}s ({summary['avgLatencyMs']} ms)")
    print(f"Timeouts (>15s SLA):    {timeouts}/{len(results)} ({summary['timeoutRate']*100:.1f}%)")
    print(f"RAM Usage:              {post_load_ram} MB (Model footprint: ~{model_ram_delta} MB)")
    print(f"Results saved to:       {out_file}")
    print("=" * 70)

if __name__ == "__main__":
    main()
