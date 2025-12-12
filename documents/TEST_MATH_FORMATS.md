# Test Math Rendering Formats

## Test Cases

### 1. Dollar format ($$...$$)
Công thức này nên render: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

### 2. Bracket format (\[...\])
Công thức này cũng nên render: \[ S = \sqrt{s(s-a)(s-b)(s-c)} \]

### 3. Inline dollar format ($...$)
Đây là công thức inline: $a^2 + b^2 = c^2$ trong câu.

### 4. Inline parenthesis format (\(...\))
Đây là công thức inline format 2: \( x^2 + 5x + 6 = 0 \) trong câu.

### 5. Mixed formats
Áp dụng công thức Heron: \[ S = \sqrt{s(s-a)(s-b)(s-c)} \] với $s$ là nửa chu vi.

Tính $s = \frac{a+b+c}{2}$ và sau đó:
$$S = \sqrt{s(s-a)(s-b)(s-c)}$$
