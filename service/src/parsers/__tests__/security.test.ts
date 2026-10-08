import { test, expect } from "bun:test";
import { tbcParser } from "../tbc";

test("TBC rejects synthetic English, Georgian and mixed payment/security SMS", () => {
  for (const text of [
    "Your OTP is 123456",
    "ერთჯერადი კოდი: 123456",
    "47.80 GEL\nVISA (***0000)\nSYNTHETIC SHOP\n01/01/2026\nSMS Code: 123456",
  ]) {
    expect(tbcParser.parse({ messageId: 1, senderId: "TBC SMS", timestamp: new Date("2026-01-01T12:00:00Z"), text })).toBeNull();
  }
});
