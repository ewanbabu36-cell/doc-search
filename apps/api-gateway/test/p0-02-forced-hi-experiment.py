#!/usr/bin/env python3
"""
DOC SEARCH - P0-02 Controlled Hindi/Hinglish Routing Experiment
Compares:
A. Prompted Base + auto language
B. Prompted Base + forced language="hi"
Samples: 3 Hindi, 3 Hinglish, 2 Medicine/Numeric/Vital
Timeout: 15s per sample
"""

import sys
import os
import json
import time
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Auto-inject known FFmpeg binary
local_app_data = os.environ.get("LOCALAPPDATA", "")
ffmpeg_bin = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-9.0.1-full_build", "bin")
if os.path.isdir(ffmpeg_bin):
    os.environ["PATH"] = ffmpeg_bin + os.pathsep + os.environ.get("PATH", "")

import whisper

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
    # 2 Medicine & Vital / Numeric
    "CORPUS-HINGLISH-012",
    "CORPUS-ANCHOR-030"
]

CLINICAL_PROMPT = (
    "Clinical consultation in Hindi and Hinglish: bukhar, dard, saans, ulti, BP, SpO2, "
    "sugar, fasting, Dolo 650, Telmisartan 40 mg, Pantoprazole 40 mg, Augmentin 625 Duo, "
    "Azithromycin 500 mg, Glycomet 500 mg, Montair-LC, Pan 40, Calpol 650."
)

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
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
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

    # Terms
    term_pres = 0
    for term in item.get("criticalTerms", []):
        words = term.lower().split()
        if all(w in hyp_text.lower() for w in words):
            term_pres += 1
    term_acc = 1.0 if not item.get("criticalTerms") else (term_pres / len(item["criticalTerms"]))

    return wer, cer, med_acc, num_acc, term_acc


def run_experiment_pass(pass_name, model, items, language_setting):
    print(f"\n=================================================================")
    print(f"RUNNING PASS: {pass_name} [language={language_setting}]")
    print(f"=================================================================")

    results = []
    latencies = []

    for idx, item in enumerate(items):
        audio_path = os.path.join(AUDIO_DIR, f"{item['id']}.wav")
        kwargs = {
            "temperature": 0.0,
            "initial_prompt": CLINICAL_PROMPT
        }
        if language_setting:
            kwargs["language"] = language_setting

        t0 = time.time()
        res = model.transcribe(audio_path, **kwargs)
        dur_ms = int((time.time() - t0) * 1000)
        latencies.append(dur_ms)

        hyp_text = res.get("text", "").strip()
        det_lang = res.get("language", "unknown")

        wer, cer, med_acc, num_acc, term_acc = evaluate_sample(item, hyp_text)

        results.append({
            "id": item["id"],
            "language": item["language"],
            "category": item["category"],
            "groundTruth": item["groundTruth"],
            "hypothesis": hyp_text,
            "detectedLanguage": det_lang,
            "latencyMs": dur_ms,
            "wer": round(wer, 3),
            "cer": round(cer, 3),
            "medAcc": round(med_acc, 3),
            "numAcc": round(num_acc, 3),
            "termAcc": round(term_acc, 3)
        })

        print(f"  [{idx+1}/{len(items)}] {item['id']} ({item['language']}): Latency={dur_ms}ms, Lang={det_lang}")
        print(f"     REF: \"{item['groundTruth']}\"")
        print(f"     HYP: \"{hyp_text}\"")

    def filter_lang(l): return [r for r in results if r["language"] == l]
    def avg(lst, k): return (sum(x[k] for x in lst) / len(lst)) if lst else 0.0

    hi = filter_lang("HINDI")
    hng = filter_lang("HINGLISH")

    summary = {
        "passName": pass_name,
        "languageSetting": language_setting or "auto",
        "sampleCount": len(results),
        "hindiWER": avg(hi, "wer"),
        "hindiCER": avg(hi, "cer"),
        "hinglishWER": avg(hng, "wer"),
        "hinglishCER": avg(hng, "cer"),
        "medicineAccuracy": avg(results, "medAcc"),
        "numericAccuracy": avg(results, "numAcc"),
        "clinicalTermAccuracy": avg(results, "termAcc"),
        "avgLatencyMs": int(sum(latencies) / len(latencies)) if latencies else 0,
        "results": results
    }

    print(f"\n--- PASS SUMMARY [{pass_name}] ---")
    print(f"Hindi WER:              {summary['hindiWER']*100:.2f}%")
    print(f"Hindi CER:              {summary['hindiCER']*100:.2f}%")
    print(f"Hinglish WER:           {summary['hinglishWER']*100:.2f}%")
    print(f"Hinglish CER:           {summary['hinglishCER']*100:.2f}%")
    print(f"Medicine Accuracy:      {summary['medicineAccuracy']*100:.2f}%")
    print(f"Numeric Accuracy:       {summary['numericAccuracy']*100:.2f}%")
    print(f"Clinical Term Accuracy: {summary['clinicalTermAccuracy']*100:.2f}%")
    print(f"Avg Latency:            {summary['avgLatencyMs']} ms")

    return summary


def main():
    print("Loading 8 targeted experiment samples from corpus...")
    with open(CORPUS_JSON, "r", encoding="utf-8") as f:
        full_corpus = json.load(f)

    item_map = {it["id"]: it for it in full_corpus}
    selected_items = [item_map[sid] for sid in TARGET_SAMPLE_IDS if sid in item_map]
    print(f"Selected {len(selected_items)} samples (3 Hindi, 3 Hinglish, 2 Medicine/Numeric).\n")

    print("Loading Whisper base model into memory...")
    t0 = time.time()
    base_model = whisper.load_model("base", device="cpu")
    print(f"Base model loaded in {time.time()-t0:.2f}s.\n")

    reports = {}

    # Pass A: Prompted Base + auto language
    reports["PASS_A_PROMPTED_BASE_AUTO"] = run_experiment_pass(
        "PASS_A_PROMPTED_BASE_AUTO", base_model, selected_items, language_setting=None
    )

    # Pass B: Prompted Base + forced language="hi"
    reports["PASS_B_PROMPTED_BASE_FORCED_HI"] = run_experiment_pass(
        "PASS_B_PROMPTED_BASE_FORCED_HI", base_model, selected_items, language_setting="hi"
    )

    out_file = os.path.join(os.environ.get("TEMP", r"C:\Users\alamr\AppData\Local\Temp"), "p0_02_forced_hi_experiment_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(reports, f, ensure_ascii=False, indent=2)
    print(f"\nControlled experiment results saved to: {out_file}")

if __name__ == "__main__":
    main()
