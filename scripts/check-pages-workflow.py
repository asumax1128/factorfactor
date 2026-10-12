"""Pinned official actionlint; checksum enforced, no production settings changed."""
import hashlib,os,subprocess,tarfile,urllib.request
from pathlib import Path
base=Path(os.environ.get('RUNNER_TEMP','/tmp'))/'factor-actionlint-1.7.7'
base.mkdir(exist_ok=True)
archive=base/'actionlint.tar.gz'
with urllib.request.urlopen('https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz',timeout=45) as r:archive.write_bytes(r.read())
assert hashlib.sha256(archive.read_bytes()).hexdigest()=="023070a287cd8cccd71515fedc843f1985bf96c436b7effaecce67290e7e0757",'Official actionlint checksum mismatch'
with tarfile.open(archive) as t:t.extract(t.getmember('actionlint'),base,filter='data')
subprocess.run([str(base/'actionlint'),'.github/workflows/math-tower-pages.yml'],check=True)
print('Workflow actionlint passed')
