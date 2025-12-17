#!/bin/bash

# TikZ Test Script
# Generates a simple TikZ diagram and converts to SVG for testing

echo "🎨 Testing TikZ → SVG conversion..."

# Create temporary directory
TMP_DIR="/tmp/tikz_test_$$"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

# Create test TikZ file
cat > test.tex << 'EOF'
\documentclass[tikz,border=2pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,calc,patterns,angles,quotes}
\usepackage{amsmath,amssymb}

\begin{document}
\begin{tikzpicture}[scale=1.5]
  % Triangle vertices
  \coordinate (A) at (0,0);
  \coordinate (B) at (4,0);
  \coordinate (C) at (1.5,2.5);
  
  % Draw triangle
  \draw[thick] (A) -- (B) -- (C) -- cycle;
  
  % Labels
  \node[below left] at (A) {$A$};
  \node[below right] at (B) {$B$};
  \node[above] at (C) {$C$};
  
  % Angle
  \pic[draw, angle radius=0.5cm, "$60°$"] {angle = B--A--C};
  
  % Side lengths
  \node[below] at ($(A)!0.5!(B)$) {$5$};
  \node[left] at ($(A)!0.5!(C)$) {$7$};
\end{tikzpicture}
\end{document}
EOF

echo "📝 Created test.tex"
cat test.tex

# Compile LaTeX → DVI
echo ""
echo "🔨 Compiling LaTeX → DVI..."
/Library/TeX/texbin/latex -interaction=nonstopmode test.tex

if [ ! -f test.dvi ]; then
    echo "❌ Failed to create DVI file"
    exit 1
fi

echo "✅ DVI created"

# Test different dvisvgm options
echo ""
echo "🧪 Testing different dvisvgm options..."

echo ""
echo "1️⃣ Default (no special options):"
/Library/TeX/texbin/dvisvgm --no-fonts --output=test-default.svg test.dvi
if [ -f test-default.svg ]; then
    echo "✅ Created test-default.svg"
    grep "viewBox=" test-default.svg | head -1
fi

echo ""
echo "2️⃣ With --exact:"
/Library/TeX/texbin/dvisvgm --no-fonts --exact --output=test-exact.svg test.dvi
if [ -f test-exact.svg ]; then
    echo "✅ Created test-exact.svg"
    grep "viewBox=" test-exact.svg | head -1
fi

echo ""
echo "3️⃣ With --exact-bbox:"
/Library/TeX/texbin/dvisvgm --no-fonts --exact-bbox --output=test-exact-bbox.svg test.dvi
if [ -f test-exact-bbox.svg ]; then
    echo "✅ Created test-exact-bbox.svg"
    grep "viewBox=" test-exact-bbox.svg | head -1
fi

echo ""
echo "4️⃣ With --bbox=preview:"
/Library/TeX/texbin/dvisvgm --no-fonts --bbox=preview --output=test-bbox-preview.svg test.dvi
if [ -f test-bbox-preview.svg ]; then
    echo "✅ Created test-bbox-preview.svg"
    grep "viewBox=" test-bbox-preview.svg | head -1
fi

echo ""
echo "5️⃣ With --bbox=min:"
/Library/TeX/texbin/dvisvgm --no-fonts --bbox=min --output=test-bbox-min.svg test.dvi
if [ -f test-bbox-min.svg ]; then
    echo "✅ Created test-bbox-min.svg"
    grep "viewBox=" test-bbox-min.svg | head -1
fi

echo ""
echo "📊 Comparing file sizes:"
ls -lh test-*.svg | awk '{print $9, $5}'

echo ""
echo "📁 All test files saved in: $TMP_DIR"
echo ""
echo "🔍 To view results, copy an SVG file content and paste into:"
echo "   file:///Users/mac/AIThink/chrome_test/test-svg.html"
echo ""
echo "💡 Recommended: Open test-default.svg in browser to see which looks best"

# Copy results to chrome_test folder
echo ""
echo "📋 Copying results to chrome_test folder..."
cp test-*.svg /Users/mac/AIThink/chrome_test/
echo "✅ Done! Check /Users/mac/AIThink/chrome_test/"
