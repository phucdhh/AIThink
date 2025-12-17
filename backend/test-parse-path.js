const path = 'M-47.726561-9.109375L-25.0469-48.39067L20.3125-9.109375H-47.726561';
const nums = Array.from(path.matchAll(/-?\d+(?:\.\d+)?/g)).map(x => parseFloat(x[0]));
console.log('All numbers:', nums);
console.log('Number count:', nums.length);

let minX = Infinity;
let minY = Infinity;
for (let i = 0; i < nums.length; i += 2) {
  const x = nums[i];
  const y = nums[i + 1];
  if (!Number.isNaN(x)) minX = Math.min(minX, x);
  if (!Number.isNaN(y)) minY = Math.min(minY, y);
  console.log(`Pair ${i/2}: (${x}, ${y})`);
}
console.log('MinX:', minX);
console.log('MinY:', minY);
