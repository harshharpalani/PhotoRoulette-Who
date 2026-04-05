const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusable chars

export function generateRoomCode(length: number = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
