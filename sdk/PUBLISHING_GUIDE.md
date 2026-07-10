# 🚀 Sentrix SDK Publishing Guide

This guide details the step-by-step instructions for publishing and releasing new versions of the official Sentrix SDKs for both Python (PyPI) and JavaScript/TypeScript (npm).

---

## 🐍 Python SDK (`sentrix-sdk` on PyPI)

### 1. Update Version
Before publishing a new release, update the version string in [pyproject.toml](file:///d:/PROJECTS/Sentrix/sdk/python/pyproject.toml):
```toml
[project]
name = "sentrix-sdk"
version = "1.0.0" # <-- Update version here
```
Also update the version string in [sentrix/__init__.py](file:///d:/PROJECTS/Sentrix/sdk/python/sentrix/__init__.py):
```python
__version__ = "1.0.0" # <-- Update version here
```

### 2. Build the Package
Run the following commands to generate the package distribution archives:
```bash
# Navigate to the Python SDK directory
cd sdk/python

# Make sure you have python-build installed
pip install build

# Clean up any old build folders if they exist
Remove-Item -Recurse -Force build, dist, *.egg-info -ErrorAction SilentlyContinue

# Build the sdist (tarball) and wheel (.whl)
python -m build
```
This will generate files in the `sdk/python/dist/` directory:
- `sentrix_sdk-1.0.0.tar.gz` (Source distribution)
- `sentrix_sdk-1.0.0-py3-none-any.whl` (Built distribution)

### 3. Test on PyPI Test Server (Optional but Recommended)
Before uploading to the main PyPI registry, you can verify everything builds and renders correctly on the official Test PyPI registry:
```bash
# Install Twine (the Python package uploader tool)
pip install twine

# Upload to Test PyPI (requires an account at https://test.pypi.org)
twine upload --repository testpypi dist/*
```
Verify the package page at: `https://test.pypi.org/project/sentrix-sdk/`

### 4. Publish to PyPI
To publish the package globally for all Python developers:
```bash
# Upload to official PyPI
twine upload dist/*
```
When prompted:
- **Username**: Use `__token__`
- **Password**: Enter your PyPI API token (generate one at https://pypi.org/manage/account/token/)

Once published, anyone can install your SDK using:
```bash
pip install sentrix-sdk
```

---

## 📦 JavaScript/Node.js SDK (`sentrix-sdk` on npm)

### 1. Update Version
Before publishing, update the version in [package.json](file:///d:/PROJECTS/Sentrix/sdk/javascript/package.json):
```json
{
  "name": "sentrix-sdk",
  "version": "1.0.0", // <-- Update version here
  ...
}
```

### 2. Run Tests
Verify that the entry points load correctly:
```bash
# Navigate to JS SDK directory
cd sdk/javascript

# Run the verify script
npm test
```

### 3. Login to npm
Log in to your public npm registry account from the terminal (one-time setup):
```bash
npm login
```
Follow the interactive prompts to authenticate via your browser or OTP code.

### 4. Build/Inspect Package contents
To verify exactly what files will be sent to npm without actually publishing:
```bash
npm pack --dry-run
```
Make sure only `src/`, `README.md`, and `LICENSE` are included (other files are correctly ignored by `.npmignore`).

### 5. Publish to npm
Publish the package to the public npm registry:
```bash
npm publish --access public
```

Once published, anyone can install your SDK using:
```bash
npm install sentrix-sdk
```
