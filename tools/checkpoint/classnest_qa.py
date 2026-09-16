"""Local ClassNest acceptance runner and responsive evidence capture."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, expect
from worker import execute

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:5173/")
    parser.add_argument("--output", default="outputs/classnest-qa")
    parser.add_argument("--thumbnail", action="store_true")
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    passed = True
    for view, dimensions in [("desktop", {"width":1440,"height":1000}), ("mobile", {"width":390,"height":844})]:
        directory = output / ("classnest-" + view)
        directory.mkdir(exist_ok=True)
        config = {"id":"classnest-"+view,"journey":"classnest","title":"ClassNest 驗收","viewport":view,"dimensions":dimensions,"target":args.base,"headless":True}
        path = directory / "input.json"
        path.write_text(json.dumps(config,ensure_ascii=False),encoding="utf-8")
        execute(path)
        result = json.loads((directory/"case.json").read_text(encoding="utf-8"))
        print(view, result["status"], flush=True)
        for step in result["steps"]:
            if step["status"] in ("blocked","failed"):
                print(step["title"],step["actual"],flush=True)
        passed = passed and result["status"] == "passed"
    matrix = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale="zh-TW",timezone_id="Asia/Taipei")
        page = context.new_page()
        page.clock.install(time=datetime(2026,9,14,1,tzinfo=timezone.utc))
        for width in [320,390,768,1440]:
            page.set_viewport_size({"width":width,"height":1000 if width==1440 else 844})
            for route in ["classnest/","classnest/teacher/","classnest/admin/",""]:
                response = page.goto(urljoin(args.base,route),wait_until="networkidle")
                assert response and response.status < 400
                if route:
                    expect(page.locator(".cn-save-status")).to_contain_text("已存於本機")
                else:
                    page.locator("#work").evaluate("el => el.scrollIntoView({behavior:'instant',block:'start'})")
                    expect(page.locator("#work article")).to_have_count(10)
                    page.wait_for_function("() => {const images=Array.from(document.querySelectorAll('#work img')).filter(i => {const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});return images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0)}")
                    page.evaluate("() => Promise.all(Array.from(document.querySelectorAll('#work img')).filter(i=>i.complete&&i.naturalWidth>0).map(i=>i.decode()))")
                    page.clock.run_for(100)
                measurement = page.evaluate("() => ({width:innerWidth, content:document.documentElement.scrollWidth})")
                valid = measurement["content"] <= measurement["width"]
                matrix.append({"width":width,"route":route or "/","passed":valid,**measurement})
                passed = passed and valid
                name = (route.strip("/").replace("/","-") or "portfolio")+f"-{width}.png"
                page.screenshot(path=str(output/name),full_page=False,animations="disabled")
                if args.thumbnail and width==1440 and route=="classnest/":
                    page.screenshot(path="public/images/work-classnest-preview.jpg",type="jpeg",quality=90,full_page=False,animations="disabled")
        browser.close()
    (output/"responsive.json").write_text(json.dumps(matrix,ensure_ascii=False,indent=2),encoding="utf-8")
    print("responsive",json.dumps(matrix),flush=True)
    raise SystemExit(0 if passed else 1)

if __name__ == "__main__":
    main()
