"""Build wheel/sdist in a temporary directory and verify distributable bytes."""
import subprocess
import tarfile
import tempfile
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
package = root / "src/scientific_calculator"
with tempfile.TemporaryDirectory(prefix="calculator-package-") as temporary:
    subprocess.run([sys.executable, "-m", "build", "--outdir", temporary, str(root)], check=True)
    wheels = list(Path(temporary).glob("*.whl"))
    sdists = list(Path(temporary).glob("*.tar.gz"))
    assert len(wheels) == len(sdists) == 1
    with zipfile.ZipFile(wheels[0]) as wheel, tarfile.open(sdists[0]) as sdist:
        wheel_names = wheel.namelist()
        sdist_names = sdist.getnames()
        assets = [p for p in package.rglob("*") if p.is_file() and p.suffix in {".html", ".css", ".js", ".json", ".txt"}]
        for asset in assets:
            name = "scientific_calculator/" + asset.relative_to(package).as_posix()
            assert wheel.read(name) == asset.read_bytes(), name
            matches = [n for n in sdist_names if n.endswith("/src/" + name)]
            assert len(matches) == 1, name
            assert sdist.extractfile(matches[0]).read() == asset.read_bytes(), name
        assert not any("demo_project" in n or n.endswith((".pdf", "db.sqlite3")) for n in wheel_names)
        forbidden = (".pdf", ".exe", ".dll", ".bmp", "db.sqlite3")
        assert not any(n.lower().endswith(forbidden) for n in wheel_names)
        assert not any(n.lower().endswith(forbidden) for n in sdist_names)
    installed = str(Path(temporary) / "installed")
    subprocess.run([sys.executable, "-m", "pip", "install", "--target", installed, str(wheels[0])], check=True)
    smoke = '''import sys
sys.path.insert(0, sys.argv[1])
from django.conf import settings
from pathlib import Path
settings.configure(INSTALLED_APPS=['django.contrib.staticfiles', 'scientific_calculator'], STATIC_URL='/static/', STATIC_ROOT=str(Path(sys.argv[1]).parent/'collected'), TEMPLATES=[{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'APP_DIRS': True}])
import django
django.setup()
from django.template import Template, Context
from django.contrib.staticfiles import finders
html = Template('{% load scientific_calculator %}{% scientific_calculator %}{% scientific_calculator %}').render(Context())
assert html.count('data-scientific-calculator') == 2
assert finders.find('scientific_calculator/calculator.js').startswith(sys.argv[1])
from django.core.management import call_command
call_command('collectstatic', interactive=False, verbosity=0)
assets=Path(sys.argv[1])/'scientific_calculator/static/scientific_calculator'
for asset in assets.iterdir():
    if asset.is_file():
        assert (Path(settings.STATIC_ROOT)/'scientific_calculator'/asset.name).read_bytes()==asset.read_bytes(), asset.name
assert (Path(settings.STATIC_ROOT)/'scientific_calculator/lists.js').is_file()
'''
    subprocess.run([sys.executable, "-I", "-c", smoke, installed], cwd=temporary, check=True)
    print(f"Installed wheel smoke and sdist verified: {len(assets)} packaged assets, no local references/runtime files")
