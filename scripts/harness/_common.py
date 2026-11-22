"""하네스 검사 스크립트 공통: 백엔드 API 매핑과 프론트 호출 경로를 읽는다."""
import json
import os
import re
from pathlib import Path

# 기본은 이 파일 기준 저장소 루트. 다른 위치를 검사하려면 CHAEKDAMI_ROOT 를 준다.
ROOT = Path(os.environ.get("CHAEKDAMI_ROOT") or Path(__file__).resolve().parents[2])
BACKEND = ROOT / "backend" / "src" / "main" / "java"
FRONTEND = ROOT / "frontend" / "src"

MAPPING = re.compile(r'@(Get|Post|Put|Patch|Delete|Request)Mapping\s*(\((.*?)\))?\s*$', re.S)
PATH_IN_ARGS = re.compile(r'(?:value\s*=\s*|path\s*=\s*)?"([^"]*)"')


def _mapping_path(args):
    if not args:
        return ""
    m = PATH_IN_ARGS.search(args)
    return m.group(1) if m else ""


def normalize(path):
    """'/api/books/{bookId}' 와 '/api/books/${id}' 를 같은 모양으로 맞춘다."""
    path = re.sub(r"\$\{[^}]*\}", "{}", path)
    path = re.sub(r"\{[^}]*\}", "{}", path)
    path = path.split("?")[0]
    return path.rstrip("/") or "/"


def backend_endpoints():
    """[(METHOD, 경로, 파일)] — 클래스 @RequestMapping 접두어를 붙인다.
    HARNESS_ENDPOINTS_JSON 이 있으면 그 파일(contract-check.py --dump 결과)을 쓴다."""
    dump = os.environ.get("HARNESS_ENDPOINTS_JSON")
    if dump:
        return [tuple(x) for x in json.loads(Path(dump).read_text(encoding="utf-8"))]
    result = []
    for f in sorted(BACKEND.rglob("*Controller.java")):
        text = f.read_text(encoding="utf-8")
        prefix = ""
        lines = text.splitlines()
        class_line = next((i for i, l in enumerate(lines) if re.search(r"\bclass\s+\w+", l)), len(lines))
        head = "\n".join(lines[:class_line])
        m = re.search(r'@RequestMapping\s*\(([^)]*)\)', head)
        if m:
            prefix = _mapping_path(m.group(1))
        body = "\n".join(lines[class_line:])
        for m in re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping(\s*\(([^)]*)\))?', body):
            method = m.group(1).upper()
            path = prefix + _mapping_path(m.group(3))
            result.append((method, path, f.relative_to(ROOT).as_posix()))
    return result


CALL = re.compile(r"apiClient\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'\"]([^`'\"]+)[`'\"]")
LITERAL = re.compile(r"[`'\"](/api/[^`'\"\s]*)[`'\"]")


def frontend_calls():
    """[(METHOD 또는 '?', 경로, 파일)] — apiClient 호출과 '/api/...' 문자열."""
    result, seen = [], set()
    for f in sorted(FRONTEND.rglob("*.ts*")):
        if "devMock" in f.name:
            continue
        text = f.read_text(encoding="utf-8")
        rel = f.relative_to(ROOT).as_posix()
        for m in CALL.finditer(text):
            key = (m.group(1).upper(), normalize(m.group(2)), rel)
            if key not in seen:
                seen.add(key); result.append((m.group(1).upper(), m.group(2), rel))
        for m in LITERAL.finditer(text):
            if any(normalize(p) == normalize(m.group(1)) and r == rel for _, p, r in result):
                continue
            key = ("?", normalize(m.group(1)), rel)
            if key not in seen:
                seen.add(key); result.append(("?", m.group(1), rel))
    return result
