# Demo Streaming Renderer

## Test this in the app:

### Test 1: Simple Math Problem
```
Giải phương trình x^2 - 5x + 6 = 0
```

Expected output with streaming:
1. First shows thinking process
2. Then structured solution with steps
3. Math formulas render as they complete

### Test 2: Geometry Problem (Heron's Formula)
```
Tính diện tích tam giác có ba cạnh 3, 4, 5
```

Expected output:
1. Thinking: "This is Heron's formula..."
2. Step 1: Calculate s = (a+b+c)/2
3. Step 2: Apply formula S = √[s(s-a)(s-b)(s-c)]
4. Step 3: Final answer

### Test 3: Complex Calculus
```
Tính đạo hàm của f(x) = x^3 + 2x^2 - 5x + 3
```

### Test 4: System of Equations
```
Giải hệ phương trình:
2x + y = 5
x - y = 1
```

## What to observe:

✅ **Progressive Display**
- Text appears line by line
- Thinking process shows first
- Then structured answer

✅ **LaTeX Rendering**
- Inline math: $x^2$ renders immediately
- Display math: $$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$ renders when complete
- Both \[...\] and $$...$$ work

✅ **Formatting**
- Headers (##, ###) styled correctly
- Numbered steps have colored borders
- Bold text highlighted
- Bullet points indented

✅ **Animations**
- Smooth fade-in for each block
- Math blocks scale in
- Cursor blinks while streaming
- Hover effects on steps

✅ **Error Handling**
- Invalid LaTeX shows in red box
- Incomplete patterns show as text
- Graceful fallbacks

## Performance Check:

1. Open browser DevTools
2. Go to Performance tab
3. Start recording
4. Ask a question
5. Observe:
   - FPS should be 55-60
   - No long tasks
   - Smooth scrolling

## Mobile Testing:

1. Open on mobile browser
2. Check responsive layout
3. Test touch scrolling
4. Verify math renders correctly
