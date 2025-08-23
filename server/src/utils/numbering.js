import { customAlphabet } from "nanoid";
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export function nextNumber(prefix){
  const id = nano();
  return `${prefix}-${new Date().getFullYear()}-${id}`;
}
