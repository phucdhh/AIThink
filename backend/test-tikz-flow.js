import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✅ Connected to backend');
  
  // Send TikZ question
  const testMessage = 'Vẽ tam giác ABC với AB = 2, AC = 3 và góc A = 60°';
  console.log(`📨 Sending message: "${testMessage}"`);
  
  socket.emit('chat:message', { message: testMessage });
});

socket.on('chat:start', (data) => {
  console.log('🚀 Chat started:', data.message);
});

socket.on('chat:thinking', (data) => {
  process.stdout.write('💭');
});

socket.on('chat:content', (data) => {
  process.stdout.write('.');
});

socket.on('chat:tikz-compiled', (data) => {
  console.log('\n\n✅ TikZ compiled! Response includes SVG');
  console.log('Response length:', data.content.length);
  
  // Check if SVG is present
  if (data.content.includes('<svg')) {
    console.log('✅ SVG found in response');
    
    // Check viewBox
    const viewBoxMatch = data.content.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      console.log('📐 ViewBox:', viewBoxMatch[1]);
    }
    
    // Check transform
    const transformMatch = data.content.match(/<g\s+id=['"]page1['"]\s+transform=['"]([^'"]+)['"]/);
    if (transformMatch) {
      console.log('🔄 Transform:', transformMatch[1]);
    }
  } else {
    console.log('⚠️ No SVG found in response');
  }
  
  // Exit after receiving compiled result
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 500);
});

socket.on('chat:done', (data) => {
  console.log('\n\n✅ Chat completed');
  console.log('Full response length:', data.content.length);
  
  // If no TikZ was compiled, check what we got
  if (!data.content.includes('<svg')) {
    console.log('⚠️ No SVG in final response');
    console.log('Response preview:', data.content.substring(0, 500));
  }
  
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 500);
});

socket.on('chat:error', (data) => {
  console.error('❌ Error:', data.error);
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('👋 Disconnected');
});

// Timeout after 60 seconds
setTimeout(() => {
  console.log('\n⏱️ Timeout - no response after 5 minutes');
  socket.disconnect();
  process.exit(1);
}, 300000);
