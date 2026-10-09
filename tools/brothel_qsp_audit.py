#!/usr/bin/env python3
"""Read-only JO9 QSP integration audit.
Usage: python brothel_qsp_audit.py path/to/jack.qsp --output brothel_audit.json
Never mutates the QSP. Zero external dependencies.
"""
import argparse, hashlib, json, re
from pathlib import Path

ANCHORS = {
 "brothel_entry": [r"interaction_city", r"city_menu_form", r"#place_base"],
 "worker_data": [r"slave", r"girl", r"assistant", r"character"],
 "action_points": [r"action", r"stamina", r"energy"],
 "economy": [r"money", r"spark", r"gold", r"service_price", r"common_price", r"billing"],
 "save_state": [r"save", r"load", r"end_day", r"new_game"],
 "ratings": [r"rating", r"grade", r"rank"],
}
TOKENS = {
 "entry": [r"interaction_city\s*=\s*22700", r"사창가 골목", r"whore_redlight", r"홍등가"],
 "money": [r"money", r"spark", r"gold", r"\$money", r"service_price"],
 "ap": [r"action_points", r"stamina", r"energy", r"actions_left"],
 "characters": [r"slave\[", r"slave_id", r"assistant", r"slave_index"],
 "day": [r"end_day", r"new_day", r"billing"],
}
def sh(s, d):
    return ''.join(chr((ord(c) + d) & 65535) for c in s)

def parse(raw):
    lines = raw.decode("utf-16-le").split("\r\n")
    if len(lines)<5 or lines[0]!="QSPGAME": raise ValueError("Not QSPGAME/UTF16LE")
    n=int(sh(lines[3],5)); at=4; locs=[]
    for _ in range(n):
        if at+4>len(lines): raise ValueError("Truncated QSP location")
        name,desc,body=[sh(lines[at+i],5) for i in range(3)]
        count=int(sh(lines[at+3],5))
        acts=[[sh(lines[at+4+j*3+i],5) for i in range(3)] for j in range(count)]
        locs.append({"name":name,"desc":desc,"body":body,"actions":acts})
        at+=4+count*3
    if at!=len(lines)-1: raise ValueError("QSP trailing data mismatch")
    return locs

def audit(path):
    raw=Path(path).read_bytes()
    locs=parse(raw)
    data={"source_name":Path(path).name,"sha256":hashlib.sha256(raw).hexdigest(),
          "file_size":len(raw),"location_count":len(locs),
          "locations":[],"integrations":{}}
    for loc in locs:
        body=loc["desc"]+"\n"+loc["body"]+"\n"+"\n".join("\n".join(a) for a in loc["actions"])
        hits={key:sum(len(re.findall(p,body,re.I)) for p in pats) for key,pats in TOKENS.items()}
        if any(hits.values()) or loc["name"] in ("interaction_city","city_menu_form","#place_base","main_screen","end_day_screen","billing","#static_txt"):
            data["locations"].append({"name":loc["name"],"hits":hits,
             "lines":len(body.splitlines()),"action_buttons":len(loc["actions"])})
    data["integrations"]["candidate_entry_locations"]=[
      n for n in ("interaction_city","city_menu_form","#place_base") if any(x["name"]==n for x in locs)]
    data["integrations"]["candidate_state_locations"]=[
      n for n in ("main_screen","end_day_screen","billing","#static_txt") if any(x["name"]==n for x in locs)]
    data["integrations"]["notes"]="These are search candidates, NOT verified variable mappings."
    return data

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("qsp")
    ap.add_argument("--output",default="brothel_qsp_audit.json")
    a=ap.parse_args()
    result=audit(a.qsp)
    Path(a.output).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"PASS read-only audit: {result['location_count']} locations, SHA256 {result['sha256']}")
    print(f"Report: {a.output}")
if __name__=="__main__": main()
