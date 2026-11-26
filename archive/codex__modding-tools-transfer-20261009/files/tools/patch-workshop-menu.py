"""Change only the existing injected native menu label; never rewrite code/RVAs."""
from pathlib import Path
import argparse,hashlib,json
BEFORE='b9b23c4399b822a334bfeb7d2fcd7984b9b5b71d68e3879129f63df3a54699f3'
AFTER='f75032d79ecb58eeb7b969cd3f774d66b091fca38a360acdabd782e03a46c6e6'
OFFSET=246512;OLD=b'Image Workshop';NEW=b'WORKSHOP'+b'\0'*(len(OLD)-len(b'WORKSHOP'))
def patch(raw):
 if hashlib.sha256(raw).hexdigest()==AFTER and raw[OFFSET:OFFSET+len(OLD)]==NEW:return raw
 if hashlib.sha256(raw).hexdigest()!=BEFORE or raw[OFFSET:OFFSET+len(OLD)+1]!=OLD+b'\0':raise ValueError('This engine is not the verified IMAGE WORKSHOP build. No file was written.')
 result=raw[:OFFSET]+NEW+raw[OFFSET+len(OLD):];assert len(result)==len(raw)
 assert result[:OFFSET]==raw[:OFFSET] and result[OFFSET+len(OLD):]==raw[OFFSET+len(OLD):]
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--target',required=True);p.add_argument('--output');a=p.parse_args();target=Path(a.target);raw=target.read_bytes();result=patch(raw);dest=Path(a.output) if a.output else target
 if result!=raw or dest!=target:dest.write_bytes(result)
 print(json.dumps({'before':hashlib.sha256(raw).hexdigest(),'after':hashlib.sha256(result).hexdigest(),'label':'WORKSHOP','offset':OFFSET,'bytes':len(result),'codeOffsetsPreserved':True}))
